import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
	bookId: {
		type: mongoose.Schema.Types.ObjectId,
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

const cartSchema = new mongoose.Schema({
	userId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: true,
		unique: true,
	},
	items: [cartItemSchema],
	total: { type: Number, default: 0 },
});

//total calculation method
cartSchema.methods.calculateTotal = function () {
	this.total = this.items.reduce(
		(acc, item) => acc + item.price * item.quantity,
		0
	);
	return this.total;
};

const Cart = mongoose.model('Cart', cartSchema);

export default Cart;
