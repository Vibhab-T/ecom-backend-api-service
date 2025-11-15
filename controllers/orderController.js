import Order from '../models/order.js';
import Cart from '../models/cart.js';
import Book from '../models/book.js';
import {
	ERROR_CODES,
	getErrorResponse,
	SUCCESS_MESSAGES,
} from '../constants/errors.js';

/**
 * create new order from user cart
 * @route POST /api/orders
 * @access Private
 */
export const createOrder = async (req, res) => {
	try {
		const userId = req.userId;

		//get the user cart
		const cart = await Cart.findOne({ userId }).populate('items.bookId');

		if (!cart || cart.items.length === 0) {
			const err = getErrorResponse('CART_NOT_FOUND');
			return res.status(err.status).json({
				success: false,
				error: err.message,
				code: err.code,
			});
		}

		//map the cart items to order items, validate stocl
		const orderItems = [];
		for (const item of cart.items) {
			const book = item.bookId;
			if (!book) continue; //skip invalids

			//validate stokc
			if (book.stock < item.quantity) {
				return res.status(400).json({
					success: false,
					error: `Not enough stock for ${book.title}`,
					code: 'ORDER_STOCK_ERROR',
				});
			}

			orderItems.push({
				bookId: book._id,
				quantity: item.quantity,
				price: book.price,
			});
		}

		//calculate total
		const totalAmount = orderItems.reduce(
			(acc, item) => acc + item.price * item.quantity,
			0
		);

		//create the order
		const order = await Order.create({
			userId,
			items: orderItems,
			totalAmount,
			status: 'pending',
		});

		//clear the cart after order creation?

		res.status(201).json({
			success: true,
			message: SUCCESS_MESSAGES.ORDER_CREATED,
			data: order,
		});
	} catch (error) {
		console.error('Order Creation Error:', err.message);
		const err = getErrorResponse('INTERNAL_SERVER_ERROR');
		res.status(err.status).json({
			success: false,
			error: err.message,
			code: err.code,
		});
	}
};

/**
 * get order by oid, users own
 * @route GET /api/orders/:orderId
 * @access Private
 */
export const getOrderById = async (req, res) => {
	try {
		const orderId = req.params.orderId;
		const userId = req.userId;

		//find order
		const order = await Order.findOne({ _id: orderId, userId }).populate(
			'items.bookId'
		);

		if (!order) {
			const err = getErrorResponse('ORDER_NOT_FOUND');
			return res.status(err.status).json({
				success: false,
				error: err.message,
				code: err.code,
			});
		}

		res.status(200).json({
			success: true,
			data: order,
		});
	} catch (error) {
		console.error('Order Creation Error:', err.message);
		const err = getErrorResponse('INTERNAL_SERVER_ERROR');
		res.status(err.status).json({
			success: false,
			error: err.message,
			code: err.code,
		});
	}
};

/**
 * get all order of logged in user
 * @route GET /api/orders
 * @access Private
 */
export const getUserOrders = async (req, res) => {
	try {
		//userId from request
		const userId = req.userId;

		//find user order and sort them by createdAt
		const orders = await Order.find({ userId }).sort({ createdAt: -1 });

		//return orders
		res.status(200).json({
			success: true,
			data: orders,
		});
	} catch (err) {
		console.error('Order Creation Error:', err.message);
		const error = getErrorResponse('INTERNAL_SERVER_ERROR');
		res.status(error.status).json({
			success: false,
			error: error.message,
			code: error.code,
		});
	}
};
