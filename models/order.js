import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
	bookId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Book',
		required: true, //book must exist
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

const orderSchema = new mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true, //order must belong to a suer
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
		paymentRefId: { type: String }, //for esewa ref number
	},
	{ timestamps: true }
);

//index faster searching,
orderSchema.index({ userId: 1 });
orderSchema.index({ status: 1 });

const Order = mongoose.model('Order', orderSchema);

export default Order;
