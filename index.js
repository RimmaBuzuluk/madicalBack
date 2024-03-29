import { Console, error } from 'console';
import express from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import { preparationValidation, registerValidation } from './validation/preparation.js';
import { validationResult } from 'express-validator';
import PreparationModel from './models/preparations.js';
import UserModul from './models/user.js';
import checkAuth from './utils/checkAuth.js';
import Cart from './models/cart.js';
import { Order } from './models/order.js';
import dotenv from 'dotenv';
dotenv.config();

mongoose
	.connect(process.env.MONGODB_URI)
	.then(() => console.log('DB OK'))
	.catch(() => console.log('db Err'));

const app = express();
app.use(express.json());
app.use(cors());

app.post('/preparation/addItem', preparationValidation, async (req, res) => {
	try {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json(errors.array());
		}

		const doc = new PreparationModel({
			preparationName: req.body.preparationName,
			preparationImg: req.body.preparationImg,
			preparationPrice: req.body.preparationPrice,
			preparationType: req.body.preparationType,
		});
		const preparation = await doc.save();
		res.json(preparation);
	} catch (err) {
		res.json(err);
	}
});

app.get('/preparation/allItem', async (req, res) => {
	try {
		let preparations;
		const preparationType = req.query.preparationType;
		const minPrice = parseInt(req.query.minPrice);
		const maxPrice = parseInt(req.query.maxPrice);
		const startDate = req.query.startDate;
		const endDate = req.query.endDate;

		const filter = {};
		if (preparationType) {
			filter.preparationType = preparationType;
		}
		if (!isNaN(minPrice) && !isNaN(maxPrice)) {
			filter.preparationPrice = { $gte: minPrice, $lte: maxPrice }; // Використовуємо $gte та $lte
		}
		if (startDate && endDate) {
			// Якщо задані як початкова та кінцева дати
			filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) }; // Використовуємо $gte та $lte для дат
		}

		preparations = await PreparationModel.find(filter);

		res.json(preparations);
	} catch (err) {
		console.log('err', err);
		res.status(500).json({
			message: 'не вдалось отримати статті',
		});
	}
});

app.post('/user/register', async (req, res) => {
	try {
		const errors = validationResult(error);
		if (!errors.isEmpty()) {
			return res.starus(400).json(errors.array());
		}
		const password = req.body.password;

		const salt = await bcrypt.genSalt(10);
		const passwordHash = await bcrypt.hash(password, salt);

		const doc = new UserModul({
			email: req.body.email,
			address: req.body.address,
			number: req.body.number,
			fullName: req.body.number,
			passwordHash,
		});

		const user = await doc.save();

		const newCart = new Cart({ user: user._id });
		await newCart.save();

		const token = jwt.sign(
			{
				_id: user._id,
			},
			'secret123',
			{ expiresIn: '30d' }
		);

		const cart = await Cart.findOne({ user: user._id });

		res.json({
			...user._doc,
			cartId: cart._id,
			token,
		});
	} catch (err) {
		console.log(err);
		res.status(500).json({
			message: 'не вдалось зареєструватись',
		});
	}
});

app.post('/user/login', async (req, res) => {
	try {
		const user = await UserModul.findOne({ email: req.body.email });

		if (!user) {
			return req.status(404).json({
				message: 'не вдалось авторизуватись1',
			});
		}

		const isValidPass = await bcrypt.compare(req.body.password, user._doc.passwordHash);

		if (!isValidPass) {
			return req.json({
				mssage: 'Не вдалось авторизуватись2',
			});
		}

		console.log(user);
		const token = jwt.sign(
			{
				_id: user._id,
			},
			'secret123',
			{ expiresIn: '30d' }
		);
		const cart = await Cart.findOne({ user: user._id });

		res.json({
			...user._doc,
			cartId: cart._id,
			token,
		});
	} catch (err) {
		return res.status(500).json({
			message: 'Не вдалось авторизуватись3',
		});
	}
});

app.get('/user/me', checkAuth, async (req, res) => {
	try {
		const user = await UserModel.findById(req.userId);

		if (!user) {
			return res.status(404).json({
				message: 'Пользователь не найден',
			});
		}

		const { passwordHash, ...userData } = user._doc;

		res.json(userData);
	} catch (err) {
		res.status(500).json({
			message: 'Немає доступу',
		});
	}
});

app.post('/carts/:cartId/items', async (req, res) => {
	try {
		const cartId = req.params.cartId;
		const itemId = req.body.itemId;

		const cart = await Cart.findById(cartId);
		if (!cart) {
			return res.status(404).send('Cart not found');
		}

		const preparation = await PreparationModel.findById(itemId);
		if (!preparation) {
			return res.status(404).send('Preparation not found');
		}

		const existingItemIndex = cart.items.findIndex(item => item.preparation._id.toString() === preparation._id.toString());

		if (existingItemIndex !== -1) {
			cart.items[existingItemIndex].quantity += 1;
			cart.items[existingItemIndex].totalPrice = preparation.preparationPrice * cart.items[existingItemIndex].quantity;
		} else {
			const newItem = {
				preparation: {
					_id: preparation._id,
					preparationName: preparation.preparationName,
					preparationPrice: preparation.preparationPrice,
					preparationType: preparation.preparationType,
					preparationImg: preparation.preparationImg,
				},
				quantity: 1,
				totalPrice: preparation.preparationPrice,
			};

			// console.log(newItem);
			cart.items.push(newItem);
		}

		cart.totalQuantity = cart.items.reduce((total, item) => total + item.quantity, 0);
		cart.totalPrice = cart.items.reduce((total, item) => total + item.totalPrice, 0);

		await cart.save();

		res.status(200).send('Item added to cart successfully');
	} catch (error) {
		console.log(error);
		res.status(500).json({ message: 'Сталася помилка під час обробки запиту' });
	}
});

app.get('/carts/:cartId/items', async (req, res) => {
	try {
		const cartId = req.params.cartId;

		const cart = await Cart.findById(cartId).populate('items');

		if (!cart) {
			return res.status(404).send('Cart not found');
		}

		res.json(cart);
	} catch (error) {
		console.log(error);
		res.status(500).json({ message: 'Сталась помилка під час отримання товарів' });
	}
});

app.delete('/carts/:cartId/items/:itemId', async (req, res) => {
	try {
		const cartId = req.params.cartId;
		const itemId = req.params.itemId;

		const cart = await Cart.findById(cartId);
		if (!cart) {
			return res.status(404).send('Cart not found');
		}

		// Видаляємо елемент з масиву items за його _id
		cart.items.pull(itemId);

		// Обчислюємо нові значення totalQuantity та totalPrice
		cart.totalQuantity = cart.items.reduce((total, item) => total + item.quantity, 0);
		cart.totalPrice = cart.items.reduce((total, item) => total + item.totalPrice, 0);

		// Зберігаємо зміни в базі даних
		await cart.save();

		// Відправляємо відповідь про успішне видалення елементу
		res.status(200).send('Item removed from cart successfully');
	} catch (error) {
		console.log(error);
		res.status(500).json({ message: 'Сталася помилка під час обробки запиту' });
	}
});

app.put('/carts/:cartId/items/:itemId', async (req, res) => {
	try {
		const cartId = req.params.cartId;
		const itemId = req.params.itemId;
		const newQuantity = req.body.quantity; // Нова кількість елементів

		const cart = await Cart.findById(cartId);
		if (!cart) {
			return res.status(404).send('Cart not found');
		}

		const cartItem = cart.items.find(item => item._id.toString() === itemId);
		if (!cartItem) {
			return res.status(404).send('Item not found in the cart');
		}

		cartItem.quantity = newQuantity;
		cartItem.totalPrice = cartItem.preparation.preparationPrice * newQuantity;

		// Оновлюємо загальну кількість і вартість корзини
		cart.totalQuantity = cart.items.reduce((total, item) => total + item.quantity, 0);
		cart.totalPrice = cart.items.reduce((total, item) => total + item.totalPrice, 0);

		await cart.save();

		res.status(200).send('Cart item quantity updated successfully');
	} catch (error) {
		console.log(error);
		res.status(500).json({ message: 'Сталася помилка під час обробки запиту' });
	}
});

app.post('/order/:cartId', async (req, res) => {
	try {
		const cartId = req.params.cartId;

		const cart = await Cart.findById(cartId);
		if (!cart) {
			return res.status(404).send('Cart not found');
		}

		// Отримати ідентифікатор користувача з корзини
		const userId = cart.user;

		// Отримати всі дані користувача за його ідентифікатором
		const user = await UserModul.findById(userId);

		const newOrder = new Order({
			// user: userId, // Передати ідентифікатор користувача
			items: cart.items,
			totalPrice: cart.totalPrice,
			totalQuantity: cart.totalQuantity,
			fullName: user.fullName,
			email: user.email,
			address: user.address,
			number: user.number,
		});

		const savedOrder = await newOrder.save();

		cart.items = [];
		cart.totalPrice = 0;
		cart.totalQuantity = 0;
		await cart.save();

		res.json(newOrder);
	} catch (error) {
		console.error('Помилка при створенні замовлення:', error);
		throw error;
	}
});

app.post('/order/:cartId', async (req, res) => {
	try {
		const cartId = req.params.cartId;

		const cart = await Cart.findById(cartId);

		if (!cart) {
			return res.status(404).send('Cart not found');
		}

		const user = await UserModul.findById(cart.user);
		console.log(user);

		const newOrder = new order({
			items: cart.items,
			totalPrice: cart.totalPrice,
			totalQuantity: cart.totalQuantity,
			fullName: user.fullName,
			email: user.email,
			address: user.address,
			number: user.number,
		});

		const savedOrder = await newOrder.save();

		cart.items = [];
		cart.totalPrice = 0;
		cart.totalQuantity = 0;
		await cart.save();

		res.json(newOrder);
		return savedOrder;
	} catch (error) {
		console.error('Помилка при створенні замовлення:', error);
		throw error;
	}
});

app.get('/orders', async (req, res) => {
	try {
		const orders = await order.find();
		res.json(orders);
	} catch (error) {
		console.error('Помилка при отриманні замовлень:', error);
		res.status(500).json({ message: 'Помилка при отриманні замовлень' });
	}
});

const PORT = process.env.PORT;

app.listen(PORT, err => {
	if (err) {
		return console.log(err);
	}
	console.log('server ok, work on port' + PORT);
});
