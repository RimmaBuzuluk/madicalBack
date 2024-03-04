import { body } from 'express-validator';

export const preparationValidation = [body('preparationName').isLength({ min: 5 }).withMessage('Назва препарату має бути більше ніж 5 символів'), body('preparationPrice').isInt({ min: 1 }).withMessage('Вказана занадто маленька ціна'), body('preparationImg').optional().isURL()];

export const registerValidation = [
	//
	body('fullName').isLength({ min: 5 }).withMessage("Ви вказали закоротке ім'я"),
	//
	body('email').isEmail().withMessage('email вказанний некоректно'),
	//
	body('password').isLength({ min: 3 }).withMessage('Довжина паролю некоректна'),
	//
	body('address').isLength({ min: 3 }).withMessage('Довжина адресси замала'),
	//
	body('number').isLength({ min: 3 }).withMessage('Довжина номеру замала'),
	//
];
