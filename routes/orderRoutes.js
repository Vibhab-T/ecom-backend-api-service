import express from 'express';
import {
	createOrder,
	getMyOrders,
	getOrderById,
	cancelOrder,
	updateOrderStatus,
} from '../controllers/orderController.js';
import { protectRoute } from '../middlewares/authMiddleware.js';

const router = express.Router();

//order routes require auth
router.use(protectRoute);

//create new order
router.post('/', createOrder);

//get user's order, all of them
router.get('/', getMyOrders);

//get order by id
router.get('/:orderId', getOrderById);

//cancel an order
router.put('/:orderId/cancel', cancelOrder);

//update order status, add admin middleware here later
router.put('/:orderId/status', updateOrderStatus);

export default router;
