import express from 'express';
import { protectRoute } from '../middlewares/authMiddleware.js';
import {
	checkEsewaPaymentStatus,
	handleEsewaFailure,
	initEsewaPayment,
	verifyEsewaPayment,
} from '../controllers/paymentController.js';
import { validateObjectId } from '../middlewares/validation.js';

const router = express.Router();

//to init a paymet for an order
router.post(
	'/esewa/init/:orderId',
	protectRoute,
	validateObjectId('orderId'),
	initEsewaPayment
);

//called by esewa after successfull payment
router.get('/esewa/verify', verifyEsewaPayment);

//called by esewa after failed payment
router.get('/esewa/failed', handleEsewaFailure);

//to check payment stats via esewa api
router.get(
	'/esewa/status/:orderId',
	protectRoute,
	validateObjectId('orderId'),
	checkEsewaPaymentStatus
);

export default router;
