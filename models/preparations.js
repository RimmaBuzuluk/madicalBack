import mongoose from 'mongoose';

const PreparationSchema = new mongoose.Schema(
	{
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
		preparationImg: String,
	},
	{
		timestamps: true,
	}
);

export default mongoose.model('Preparation', PreparationSchema);
///Pills,
// Capsules,
// Kraplі,
// Plastiri,
// Injections,
// CosmeticCare,
// Adjust medically,
// Children and grown up children
