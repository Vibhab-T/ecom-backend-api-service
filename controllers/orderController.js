import Order from '../models/order.js';
import Cart from '../models/cart.js';
import Book from '../models/book.js';
import { getErrorResponse } from '../constants/errors.js';

/**
 * Generate unique order number
 */
const generateOrderNumber = () => {
	const timestamp = Date.now().toString(36).toUpperCase();
	const random = Math.random().toString(36).substring(2, 7).toUpperCase();
	return `ORD-${timestamp}-${random}`;
};

/**
 * Create new order from cart
 * @route   POST /api/orders
 * @access  Private
 */
export const createOrder = async (req, res) => {
	try {
		const userId = req.userId;
		const { shippingAddress, paymentMethod, notes } = req.body;

		// Validate required fields
		if (!shippingAddress || !paymentMethod) {
			return res.status(400).json({
				success: false,
				error: 'Shipping address and payment method are required',
				code: 'MISSING_FIELDS',
			});
		}

		// Get user's cart
		const cart = await Cart.findOne({ userId }).populate('items.bookId');

		if (!cart || cart.items.length === 0) {
			return res.status(400).json({
				success: false,
				error: 'Cart is empty',
				code: 'EMPTY_CART',
			});
		}

		// Validate stock availability for all items
		for (const item of cart.items) {
			const book = await Book.findById(item.bookId._id);

			if (!book) {
				return res.status(404).json({
					success: false,
					error: `Book not found: ${item.bookId.title}`,
					code: 'BOOK_NOT_FOUND',
				});
			}

			if (book.stock < item.quantity) {
				return res.status(400).json({
					success: false,
					error: `Insufficient stock for ${book.title}. Only ${book.stock} available`,
					code: 'INSUFFICIENT_STOCK',
				});
			}
		}

		// Prepare order items
		const orderItems = cart.items.map((item) => ({
			bookId: item.bookId._id,
			title: item.bookId.title,
			author: item.bookId.author,
			quantity: item.quantity,
			price: item.price,
			subtotal: item.price * item.quantity,
		}));

		// Create order WITHOUT calculating totals manually, but via the model
		const order = new Order({
			userId,
			orderNumber: generateOrderNumber(),
			items: orderItems,
			shippingAddress,
			paymentMethod,
			paymentStatus:
				paymentMethod === 'cash_on_delivery' ? 'pending' : 'completed',
			orderStatus: 'confirmed',
			notes,
			// DON'T set subtotal, tax, shippingCost, total here
		});

		//  ONE METHOD TO RULE THEM ALL
		order.calculateOrderCosts();

		// Save the order
		await order.save();

		// Update book stock
		for (const item of cart.items) {
			await Book.findByIdAndUpdate(item.bookId._id, {
				$inc: { stock: -item.quantity },
			});
		}

		// Clear cart after successful order
		cart.items = [];
		cart.total = 0;
		await cart.save();

		return res.status(201).json({
			success: true,
			message: 'Order created successfully',
			order,
		});
	} catch (error) {
		console.error('Create Order Error:', error.message);
		const errResponse = getErrorResponse('INTERNAL_SERVER_ERROR');
		return res.status(errResponse.status).json({
			success: false,
			error: errResponse.message,
			code: errResponse.code,
		});
	}
};

/**
 * Get all orders for logged-in user
 * @route   GET /api/orders
 * @access  Private
 */
export const getMyOrders = async (req, res) => {
	try {
		const userId = req.userId;
		const { page = 1, limit = 10, status } = req.query;

		// Build query
		const query = { userId };
		if (status) {
			query.orderStatus = status;
		}

		// Calculate pagination
		const skip = (parseInt(page) - 1) * parseInt(limit);

		// Get orders with pagination
		const orders = await Order.find(query)
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(parseInt(limit))
			.populate('items.bookId', 'imagePath');

		// Get total count
		const total = await Order.countDocuments(query);

		return res.status(200).json({
			success: true,
			orders,
			pagination: {
				currentPage: parseInt(page),
				totalPages: Math.ceil(total / parseInt(limit)),
				totalOrders: total,
				limit: parseInt(limit),
			},
		});
	} catch (error) {
		console.error('Get Orders Error:', error.message);
		const errResponse = getErrorResponse('INTERNAL_SERVER_ERROR');
		return res.status(errResponse.status).json({
			success: false,
			error: errResponse.message,
			code: errResponse.code,
		});
	}
};

/**
 * Get single order by ID
 * @route   GET /api/orders/:orderId
 * @access  Private
 */
export const getOrderById = async (req, res) => {
	try {
		const userId = req.userId;
		const { orderId } = req.params;

		// Find order and ensure it belongs to user
		const order = await Order.findOne({
			_id: orderId,
			userId,
		}).populate('items.bookId', 'imagePath');

		if (!order) {
			return res.status(404).json({
				success: false,
				error: 'Order not found',
				code: 'ORDER_NOT_FOUND',
			});
		}

		return res.status(200).json({
			success: true,
			order,
		});
	} catch (error) {
		console.error('Get Order Error:', error.message);
		const errResponse = getErrorResponse('INTERNAL_SERVER_ERROR');
		return res.status(errResponse.status).json({
			success: false,
			error: errResponse.message,
			code: errResponse.code,
		});
	}
};

/**
 * Cancel an order
 * @route   PUT /api/orders/:orderId/cancel
 * @access  Private
 */
export const cancelOrder = async (req, res) => {
	try {
		const userId = req.userId;
		const { orderId } = req.params;

		// Find order
		const order = await Order.findOne({ _id: orderId, userId });

		if (!order) {
			return res.status(404).json({
				success: false,
				error: 'Order not found',
				code: 'ORDER_NOT_FOUND',
			});
		}

		// Check if order can be cancelled
		if (['delivered', 'cancelled'].includes(order.orderStatus)) {
			return res.status(400).json({
				success: false,
				error: `Cannot cancel ${order.orderStatus} order`,
				code: 'INVALID_ORDER_STATUS',
			});
		}

		// Update order status
		order.orderStatus = 'cancelled';
		order.cancelledAt = new Date();
		await order.save();

		// Restore book stock
		for (const item of order.items) {
			await Book.findByIdAndUpdate(item.bookId, {
				$inc: { stock: item.quantity },
			});
		}

		return res.status(200).json({
			success: true,
			message: 'Order cancelled successfully',
			order,
		});
	} catch (error) {
		console.error('Cancel Order Error:', error.message);
		const errResponse = getErrorResponse('INTERNAL_SERVER_ERROR');
		return res.status(errResponse.status).json({
			success: false,
			error: errResponse.message,
			code: errResponse.code,
		});
	}
};

/**
 * Update order status (Admin only)
 * @route   PUT /api/orders/:orderId/status
 * @access  Private/Admin
 */
export const updateOrderStatus = async (req, res) => {
	try {
		const { orderId } = req.params;
		const { orderStatus } = req.body;

		// Validate status
		const validStatuses = [
			'pending',
			'confirmed',
			'processing',
			'shipped',
			'delivered',
			'cancelled',
		];

		if (!validStatuses.includes(orderStatus)) {
			return res.status(400).json({
				success: false,
				error: 'Invalid order status',
				code: 'INVALID_STATUS',
			});
		}

		// Find and update order
		const order = await Order.findById(orderId);

		if (!order) {
			return res.status(404).json({
				success: false,
				error: 'Order not found',
				code: 'ORDER_NOT_FOUND',
			});
		}

		order.orderStatus = orderStatus;

		// Set delivered date if status is delivered
		if (orderStatus === 'delivered') {
			order.deliveredAt = new Date();
		}

		await order.save();

		return res.status(200).json({
			success: true,
			message: 'Order status updated',
			order,
		});
	} catch (error) {
		console.error('Update Order Status Error:', error.message);
		const errResponse = getErrorResponse('INTERNAL_SERVER_ERROR');
		return res.status(errResponse.status).json({
			success: false,
			error: errResponse.message,
			code: errResponse.code,
		});
	}
};
