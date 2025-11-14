import express from 'express';
import {
	getCart,
	addToCart,
	updateCartItem,
	removeFromCart,
	clearCart,
} from '../controllers/cartController.js';
import { protectRoute } from '../middlewares/authMiddleware.js';

const router = express.Router();

//cart routes require authentication
router.use(protectRoute);

//get user cart
router.get('/', getCart);

//add item to cart
router.post('/items', addToCart);

//update cart item quantity
router.put('/items/:bookId', updateCartItem);

//remoce item
router.delete('/items/:bookId', removeFromCart);

//clear cart
router.delete('/', clearCart);

export default router;
