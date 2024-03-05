import mongoose from 'mongoose';

const OrderItemSchema = new mongoose.Schema(
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

const OrderSchema = new mongoose.Schema(
	{
		items: [OrderItemSchema], // Масив товарів у замовленні
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
		fullName: {
			type: String,
			required: true,
		},
		email: {
			type: String,
			required: true,
		},
		address: {
			type: String,
			required: true,
		},
		number: {
			type: String,
			required: true,
		},
	},
	{
		timestamps: true,
	}
);

const Order = mongoose.model('Order', OrderSchema);

export { Order };
