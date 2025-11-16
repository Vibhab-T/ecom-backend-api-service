import axios from 'axios';
import crypto, { sign } from 'crypto';
import Order from '../models/order.js';
import { getErrorResponse } from '../constants/errors.js';
import { generateSignature } from '../utils/helpers.js';
import Book from '../models/book.js';
import Cart from '../models/cart.js';

/**
 * step 1: initiate payment by generating esewa url
 * @route POST /api/payment/esewa/init/:orderId
 * @access Private
 */
export const initEsewaPayment = async (req, res) => {
	try {
		const { orderId } = req.params;
		const userId = req.userId;

		//find the order
		const order = await Order.findOne({ _id: orderId, userId });
		if (!order) {
			const err = getErrorResponse('ORDER_NOT_FOUND');
			return res.status(err.status).json({ success: false });
		}

		//check if order is already paid or cancelled
		if (order.status === 'paid') {
			return res.status(400).json({
				success: false,
				error: 'Order is already paid',
				code: 'ORDER_ALREADY_PAID',
			});
		}

		if (order.status === 'cancelled') {
			return res.status(400).json({
				success: false,
				error: 'Order is cancelled',
				code: 'ORDER_CANCELLED',
			});
		}

		//generate signature for the request
		const message = `total_amount=${
			order.totalAmount
		},transaction_uuid=${order._id.toString()},product_code=${
			process.env.ESEWA_MERCHANT_CODE
		}`;

		const signature = generateSignature(message, process.env.ESEWA_SECRET_KEY);

		//esewa params, defined in their docs
		const esewaParams = {
			amount: order.totalAmount,
			tax_amount: 0,
			product_service_charge: 0,
			product_delivery_charge: 0,
			product_code: process.env.ESEWA_MERCHANT_CODE,
			total_amount: order.totalAmount + 0 + 0 + 0, //total = amt + tax + service + delivery
			transaction_uuid: order._id.toString(),
			success_url: `${process.env.SERVER_URL}/api/payment/esewa/verify`,
			failure_url: `${process.env.SERVER_URL}/api/payment/esewa/failed`,
			signed_field_names: 'total_amount,transaction_uuid,product_code',
			signature: signature,
		};

		//generate redirect url for v2 api, payment url
		const paymentUrl = `https://rc-epay.esewa.com.np/api/epay/main/v2/form`;

		//return ejs view with the data
		return res.render('payment/redirect', {
			order,
			params: esewaParams,
			paymentUrl,
		});
	} catch (error) {
		console.error('Initiate Esewa Payment Error:', error.message);
		// Render error view
		res.status(500).render('payment/error', {
			title: 'Payment Initialization Failed',
			message: 'An error occurred while initializing payment.',
			details: {
				code: 'PAYMENT_INIT_ERROR',
			},
		});
	}
};

/**
 * step 2 verify esewa payment after succcessful redirect
 * @route GET /api/payment/esewa/verify
 * @access Public, called by esewa
 */
export const verifyEsewaPayment = async (req, res) => {
	try {
		//esewa sends base64 encoded data in query param
		const encodedData = req.query.data;

		if (!encodedData) {
			//return and render error view
			return res.render('payment/error', {
				title: 'Payment Verification Failed',
				message: 'No payment data received from eSewa.',
				details: {
					code: 'NO_PAYMENT_DATA',
				},
			});
		}

		//decode base64 data
		const decodedData = JSON.parse(
			Buffer.from(encodedData, 'base64').toString('utf-8')
		);

		//get the data
		const {
			transaction_code,
			status,
			total_amount,
			transaction_uuid,
			product_code,
			signed_field_names,
			signature,
		} = decodedData;

		//verify signature to ensure data integrity
		const message = `transaction_code=${transaction_code},status=${status},total_amount=${total_amount},transaction_uuid=${transaction_uuid},product_code=${product_code},signed_field_names=${signed_field_names}`;
		const expectedSign = generateSignature(
			message,
			process.env.ESEWA_SECRET_KEY
		);

		if (signature !== expectedSign) {
			console.error('Signature mismatch - potential fraud!! wee wuuu weee wuu');

			//return and return error view
			return res.render('payment/error', {
				title: 'Security Verification Failed',
				message:
					'Payment signature verification failed. This could be a fraudulent transaction.',
				details: {
					code: 'SIGNATURE_MISMATCH',
				},
			});
		}

		//find the order and if none render error view
		const order = await Order.findById(transaction_uuid);
		if (!order) {
			return res.render('payment/error', {
				title: 'Order Not Found',
				message: 'The order associated with this payment could not be found.',
				details: {
					code: 'ORDER_NOT_FOUND',
					orderId: transaction_uuid,
				},
			});
		}

		///verify amount matches
		if (parseFloat(total_amount) !== order.totalAmount) {
			console.error('Amount mismatch - fraud');
			return res.render('payment/error', {
				title: 'Payment Amount Mismatch',
				message: "The payment amount doesn't match the order total.",
				details: {
					code: 'AMOUNT_MISMATCH',
					orderId: order._id,
				},
			});
		}

		//check status from esewa
		if (status === 'COMPLETE') {
			//update order status
			order.status = 'paid';
			order.paymentRefId = transaction_code;
			await order.save();

			//reduce stock for each book in the order
			for (const item of order.items) {
				await Book.findByIdAndUpdate(item.bookId, {
					$inc: { stock: -item.quantity },
				});
			}

			//clear cart after successfull payment
			await Cart.findOneAndUpdate(
				{
					userId: order.userId,
				},
				{ $set: { items: [] } }
			);

			//return sucess render
			return res.render('payment/success', {
				order,
				transactionCode: transaction_code,
				totalAmount: total_amount,
			});
		} else {
			//payment not complete
			//update order status to failed
			order.status = 'failed';
			await order.save();

			//render error view again
			return res.render('payment/failed', {
				reason: `Payment status: ${status}`,
			});
		}
	} catch (error) {
		console.error('Verify Esewa Payment Error:', error.message);
		// render error view
		return res.status(500).render('payment/error', {
			title: 'Payment Verification Error',
			message: 'An error occurred while verifying your payment.',
			details: {
				code: 'VERIFICATION_ERROR',
			},
		});
	}
};

/**
 * step 3, handle failed payment redirects
 * @route GET /api/payment/esewa/failed
 * @access Public, called by esewa
 */
export const handleEsewaFailure = async (req, res) => {
	try {
		//esewa might send error data, log
		console.log('Payment failed, query params = ', req.query);

		//render error
		return res.render('payment/failed', {
			reason: 'Payment was cancelled or failed on eSewa',
		});
	} catch (error) {
		console.error('Handle Esewa Failure Error:', error.message);
		// render error view
		return res.status(500).render('payment/error', {
			title: 'Error Processing Failure',
			message: 'An error occurred while processing the payment failure.',
			details: {
				code: 'FAILURE_HANDLER_ERROR',
			},
		});
	}
};

/**
 * optional step 4 - check paymetn status via esewa api
 * @route GET /api/payment/esewa/status/:orderId
 * @access Private
 */
export const checkEsewaPaymentStatus = async (req, res) => {
	try {
		const { orderId } = req.params;
		const userId = req.userId;

		//find the order
		const order = await Order.findOne({ _id: orderId, userId });
		if (!order) {
			const err = getErrorResponse('ORDER_NOT_FOUND');
			return res.status(err.status).json({
				success: false,
				error: err.message,
				code: err.code,
			});
		}

		//call esewa status check api
		const statusUrl = `https://rc.esewa.com.np/api/epay/transaction/status/?product_code=${process.env.ESEWA_MERCHANT_CODE}&total_amount=${order.totalAmount}&transaction_uuid=${order._id}`;

		const response = await axios.get(statusUrl);
		const statusData = response.data;

		//update order status based on esewa status
		if (statusData.status === 'COMPLETE') {
			if (order.status !== 'paid') {
				(order.status = 'paid'), (order.paymentRefId = statusData.red_id);
				await order.save();

				//reduce stock
				for (const item of order.items) {
					await Book.findByIdAndUpdate(item.bookId, {
						$inc: { stock: -item.quantity },
					});
				}

				//clear cart
				await Cart.findOneAndUpdate(
					{ userId: order.userId },
					{ $set: { items: [] } }
				);
			}
		} else if (
			statusData.status === 'PENDING' ||
			statusData.status === 'AMBIGUOUS'
		) {
			//payment still processing
			order.status = 'pending';
			await order.save();
		} else {
			//payment failed, cancelled, not found
			order.status = 'failed';
			await order.save();
		}

		//return updated order ingo
		return res.status(200).json({
			success: true,
			message: 'Payment status checked',
			data: {
				orderId: order._id,
				orderStatus: order.status,
				paymentStatus: statusData.status,
				refId: statusData.ref_id,
			},
		});
	} catch (error) {
		console.error('Check Esewa Payment Status Error:', error.message);
		const err = getErrorResponse('INTERNAL_SERVER_ERROR');
		return res.status(err.status).json({
			success: false,
			error: err.message,
			code: err.code,
		});
	}
};
