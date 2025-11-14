import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
	bookId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Book',
		required: true,
	},
	title: { type: String, required: true },
	author: { type: String, required: true },
	quantity: {
		type: Number,
		required: true,
		min: [1, 'Quantity must be at least 1'],
	},
	price: {
		type: Number,
		required: true,
		min: [0, 'Price cannot be negative'],
	},
	subtotal: {
		type: Number,
		required: true,
	},
});

const shippingAddressSchema = new mongoose.Schema({
	fullName: { type: String, required: true },
	phoneNumber: { type: String, required: true },
	address: { type: String, required: true },
	city: { type: String, required: true },
	state: { type: String, required: true },
	zipCode: { type: String, required: true },
	country: { type: String, required: true, default: 'USA' },
});

const orderSchema = new mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
			index: true,
		},
		orderNumber: {
			type: String,
			required: true,
			unique: true,
		},
		items: [orderItemSchema],
		shippingAddress: {
			type: shippingAddressSchema,
			required: true,
		},
		paymentMethod: {
			type: String,
			enum: ['credit_card', 'debit_card', 'paypal', 'cash_on_delivery'],
			required: true,
		},
		paymentStatus: {
			type: String,
			enum: ['pending', 'completed', 'failed', 'refunded'],
			default: 'pending',
		},
		orderStatus: {
			type: String,
			enum: [
				'pending',
				'confirmed',
				'processing',
				'shipped',
				'delivered',
				'cancelled',
			],
			default: 'pending',
		},
		subtotal: {
			type: Number,
			default: 0,
			min: 0,
		},
		tax: {
			type: Number,
			default: 0,
			min: 0,
		},
		shippingCost: {
			type: Number,
			default: 0,
			min: 0,
		},
		total: {
			type: Number,
			default: 0,
			min: 0,
		},
		notes: {
			type: String,
			maxlength: 500,
		},
		cancelledAt: Date,
		deliveredAt: Date,
	},
	{
		timestamps: true,
	}
);

//indexes faster search
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ orderStatus: 1 });

//methods of the class

/**
 * Calculate subtotal from items
 * @returns {number} Subtotal amount
 */
orderSchema.methods.calculateSubtotal = function () {
	this.subtotal = this.items.reduce((acc, item) => acc + item.subtotal, 0);
	return this.subtotal;
};

/**
 * Calculate tax based on subtotal
 * @param {number} taxRate - Tax rate (default 8%)
 * @returns {number} Tax amount
 */
orderSchema.methods.calculateTax = function (taxRate = 0.08) {
	this.tax = parseFloat((this.subtotal * taxRate).toFixed(2));
	return this.tax;
};

/**
 * Calculate shipping cost based on subtotal
 * @param {number} freeShippingThreshold - Free shipping threshold
 * @returns {number} Shipping cost
 */
orderSchema.methods.calculateShippingCost = function (
	freeShippingThreshold = 50
) {
	this.shippingCost = this.subtotal >= freeShippingThreshold ? 0 : 199;
	return this.shippingCost;
};

/**
 * Calculate total (subtotal + tax + shipping)
 * @returns {number} Total amount
 */
orderSchema.methods.calculateTotal = function () {
	this.total = parseFloat(
		(this.subtotal + this.tax + this.shippingCost).toFixed(2)
	);
	return this.total;
};

/**
 * Calculate all order costs in one method
 * @param {object} options - Configuration options
 * @param {number} options.taxRate - Tax rate (default 8%)
 * @param {number} options.freeShippingThreshold - Free shipping threshold
 * @returns {object} All calculated costs
 */
orderSchema.methods.calculateOrderCosts = function (options = {}) {
	const { taxRate = 0.08, freeShippingThreshold = 50 } = options;

	// Calculate in order: subtotal → tax → shipping → total
	this.calculateSubtotal();
	this.calculateTax(taxRate);
	this.calculateShippingCost(freeShippingThreshold);
	this.calculateTotal();

	return {
		subtotal: this.subtotal,
		tax: this.tax,
		shippingCost: this.shippingCost,
		total: this.total,
	};
};

/**
 * Check if order can be cancelled
 * @returns {boolean} True if order can be cancelled
 */
orderSchema.methods.canBeCancelled = function () {
	return !['delivered', 'cancelled'].includes(this.orderStatus);
};

/**
 * Check if order can be refunded
 * @returns {boolean} True if order can be refunded
 */
orderSchema.methods.canBeRefunded = function () {
	const refundWindow = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
	const orderAge = Date.now() - this.createdAt.getTime();

	return (
		this.orderStatus === 'delivered' &&
		this.paymentStatus === 'completed' &&
		orderAge <= refundWindow
	);
};

/**
 * Get order summary for display
 * @returns {object} Order summary
 */
orderSchema.methods.getSummary = function () {
	return {
		orderNumber: this.orderNumber,
		status: this.orderStatus,
		itemCount: this.items.length,
		totalItems: this.items.reduce((acc, item) => acc + item.quantity, 0),
		subtotal: this.subtotal,
		tax: this.tax,
		shippingCost: this.shippingCost,
		total: this.total,
		createdAt: this.createdAt,
	};
};

//static methods, called on teh order model

/**
 * Get order statistics for a user
 * @param {string} userId - User ID
 * @returns {object} Order statistics
 */
orderSchema.statics.getUserStats = async function (userId) {
	const stats = await this.aggregate([
		{ $match: { userId: mongoose.Types.ObjectId(userId) } },
		{
			$group: {
				_id: null,
				totalOrders: { $sum: 1 },
				totalSpent: { $sum: '$total' },
				averageOrderValue: { $avg: '$total' },
			},
		},
	]);

	return stats[0] || { totalOrders: 0, totalSpent: 0, averageOrderValue: 0 };
};

/**
 * Get orders by status
 * @param {string} status - Order status
 * @returns {Array} Orders with given status
 */
orderSchema.statics.getOrdersByStatus = function (status) {
	return this.find({ orderStatus: status }).sort({ createdAt: -1 });
};

//presave methods, called before .save

/**
 * Automatically calculate costs before saving if items exist
 */
orderSchema.pre('save', function (next) {
	// Only calculate if items exist and costs haven't been calculated
	if (this.items && this.items.length > 0 && this.subtotal === 0) {
		this.calculateOrderCosts();
	}
	next();
});

/**
 * Virtual property: Is order completed?
 */
orderSchema.virtual('isCompleted').get(function () {
	return this.orderStatus === 'delivered';
});

/**
 * Virtual property: Is order active?
 */
orderSchema.virtual('isActive').get(function () {
	return !['delivered', 'cancelled'].includes(this.orderStatus);
});

/**
 * Virtual property: Days since order
 */
orderSchema.virtual('daysSinceOrder').get(function () {
	const now = new Date();
	const orderDate = this.createdAt;
	const diffTime = Math.abs(now - orderDate);
	const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
	return diffDays;
});

// Enable virtuals in JSON output
orderSchema.set('toJSON', { virtuals: true });
orderSchema.set('toObject', { virtuals: true });

const Order = mongoose.model('Order', orderSchema);

export default Order;

/*
// Example 1: Creating an order (in controller)
const order = new Order({
  userId,
  orderNumber: generateOrderNumber(),
  items: orderItems,
  shippingAddress,
  paymentMethod,
  notes,
});

//  ONE METHOD TO RULE tHEM ALL
order.calculateOrderCosts();
await order.save();


// Example 2: Custom tax rate or shipping threshold
order.calculateOrderCosts({
  taxRate: 0.10,              // 10% tax
  freeShippingThreshold: 100  // Free shipping over $100
});


// Example 3: Check if order can be cancelled
if (order.canBeCancelled()) {
  order.orderStatus = 'cancelled';
  await order.save();
}


// Example 4: Get order summary
const summary = order.getSummary();
console.log(summary);
// {
//   orderNumber: 'ORD-XXX',
//   status: 'confirmed',
//   itemCount: 3,
//   totalItems: 5,
//   subtotal: 79.97,
//   tax: 6.40,
//   shippingCost: 0,
//   total: 86.37,
//   createdAt: '2024-01-15T...'
// }


// Example 5: Get user statistics
const stats = await Order.getUserStats(userId);
console.log(stats);
// {
//   totalOrders: 12,
//   totalSpent: 450.75,
//   averageOrderValue: 37.56
// }


// Example 6: Using virtuals
console.log(order.isCompleted);    // false
console.log(order.isActive);       // true
console.log(order.daysSinceOrder); // 3
*/
