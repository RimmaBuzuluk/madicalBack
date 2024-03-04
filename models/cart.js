import mongoose from 'mongoose';

const CartItemSchema = new mongoose.Schema(
	{
		preparation: {
			_id: {
				type: mongoose.Schema.Types.ObjectId,
				ref: 'Preparation',
				required: true,
			},
			preparationName: {
				type: String,
				required: true,
			},
			preparationPrice: {
				type: Number,
				required: true,
			},
			preparationType: {
				type: String,
				required: true,
			},
			preparationImg: {
				type: String,
				required: true,
			},
		},
		quantity: {
			type: Number,
			required: true,
			default: 1,
		},
		totalPrice: {
			type: Number,
			required: true,
		},
	},
	{
		timestamps: true,
	}
);

const CartSchema = new mongoose.Schema(
	{
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
			unique: true, // Кожен користувач може мати лише одну корзину
		},
		items: [CartItemSchema], // Масив товарів у корзині
		totalQuantity: {
			type: Number,
			required: true,
			default: 0,
		},
		totalPrice: {
			type: Number,
			required: true,
			default: 0,
		},
	},
	{
		timestamps: true,
	}
);

export default mongoose.model('Cart', CartSchema);
