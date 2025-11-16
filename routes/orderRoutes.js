import express from 'express';
import { protectRoute } from '../middlewares/authMiddleware.js';
import {
	createOrder,
	getOrderById,
	getUserOrders,
} from '../controllers/orderController.js';
import { validateObjectId } from '../middlewares/validation.js';

const router = express.Router();

//all routes are private routes so
router.use(protectRoute);
router.post('/', createOrder);
router.get('/', getUserOrders);
router.get('/:orderId', validateObjectId('orderId'), getOrderById); //with validation

export default router;
