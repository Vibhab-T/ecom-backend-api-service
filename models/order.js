import mongoose, { trusted } from 'mongoose';

const orderItemSchema = new mongoose.Schema({
	bookdId: {
		type: mongoode.schema.Types.ObjectId,
		ref: 'Book',
		required: true,
	},
	quantity: {
		type: Number,
		required: true,
		min: [1, 'Quantity must be at least 1'],
		default: 1,
	},
	price: {
		type: Number,
		required: true,
	},
});

const orderSchema = new mongoose.schema(
	{
		userId: {
			type: mongoose.schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		items: [orderItemSchema],
		totalAmount: {
			type: Number,
			required: true,
			min: [0, 'Total amount can not be negative'],
		},
		status: {
			type: String,
			enum: ['pending', 'paid', 'failed', 'cancelled'],
			default: 'pending',
		},
	},
	{ timestamps: true }
);

//index faster searching,
orderSchema.index({ userId: 1 });

const Order = mongoose.model('Order', orderSchema);

export default Order;
