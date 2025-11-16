import Cart from '../models/cart.js';
import Book from '../models/book.js';
import { getErrorResponse } from '../constants/errors.js';

/**
 * Get user cart
 * @route GET /api/cart
 * @access Private
 */
export const getCart = async (req, res) => {
	try {
		const userId = req.userId;

		//fina cart and populate book details
		let cart = await Cart.findOne({ userId }).populate({
			path: 'items.bookId',
			select: 'title author price imagePath stock',
		});

		//create empty cart if doesnt exits
		if (!cart) {
			cart = await Cart.create({ userId, items: [], total: 0 });
		}

		return res.status(200).json({
			success: true,
			cart,
		});
	} catch (error) {
		console.log('Get cart error: ', error.message);
		const errResponse = getErrorResponse('INTERNAL_SERVER_ERROR');
		return res.status(errResponse.status).json({
			success: false,
			error: errResponse.message,
			code: errResponse.code,
		});
	}
};

/**
 * Add item to cart
 * @route POST /api/cart/items
 */
export const addToCart = async (req, res) => {
	try {
		const userId = req.userId;
		const { bookId, quantity = 1 } = req.body;

		//validate quiantity
		if (quantity < 1) {
			const error = getErrorResponse('CART_INVALID_QUANTITY');
			return res.status(error.status).json({
				success: false,
				error: error.message,
				code: error.code,
			});
		}

		//book exists?
		const book = await Book.findById(bookId);
		if (!book) {
			const error = getErrorResponse('BOOK_NOT_FOUND');
			return res.status(error.status).json({
				success: false,
				error: error.message,
				code: error.code,
			});
		}

		//enuff stocks? not using constants in error messages here bc calculation
		if (book.stock < quantity) {
			return res.status(400).json({
				success: false,
				error: `Insufficient stock. Only ${book.stock} items available`,
				code: 'INSUFFICIENT_STOCK',
			});
		}

		//find or create cart
		let cart = await Cart.findOne({ userId });
		if (!cart) {
			cart = new Cart({ userId, items: [] });
		}

		//check if item alrady is in cart
		const existIndex = cart.items.findIndex(
			(item) => item.bookId.toString() === bookId
		);

		if (existIndex > -1) {
			//update quantity if item exits
			const newQuantity = cart.items[existIndex].quantity + quantity;

			//check stock for new quant
			if (book.stock < newQuantity) {
				return res.status(400).json({
					success: false,
					error: `Cannot add ${quantity} more. Only ${
						book.stock - cart.items[existIndex].quantity
					} items available`,
					code: 'INSUFFICIENT_STOCK',
				});
			}

			cart.items[existIndex].quantity = newQuantity;
		} else {
			//add new item
			cart.items.push({
				bookId,
				quantity,
				price: book.price,
			});
		}

		//calculate total and save
		cart.calculateTotal();
		await cart.save();

		//populate book deets before responidng
		await cart.populate({
			path: 'items.bookId',
			select: 'title author price imagePath stock',
		});

		return res.status(200).json({
			success: true,
			message: 'Item added to cart',
			cart,
		});
	} catch (error) {
		console.error('Add to Cart Error:', error.message);
		const errResponse = getErrorResponse('INTERNAL_SERVER_ERROR');
		return res.status(errResponse.status).json({
			success: false,
			error: errResponse.message,
			code: errResponse.code,
		});
	}
};

/**
 * update cart wuantity
 * @route PUT api/cart/items/:bookId
 * @access Private
 */
export const updateCartItem = async (req, res) => {
	try {
		const userId = req.userId;
		const { bookId } = req.params;
		const { quantity } = req.body;

		// Validate quantity
		if (quantity < 1) {
			const error = getErrorResponse('CART_INVALID_QUANTITY');
			return res.status(error.status).json({
				success: false,
				error: error.message,
				code: error.code,
			});
		}

		// Find cart
		const cart = await Cart.findOne({ userId });
		if (!cart) {
			const error = getErrorResponse('CART_NOT_FOUND');
			return res.status(error.status).json({
				success: false,
				error: error.message,
				code: error.code,
			});
		}

		// Find item in cart
		const itemIndex = cart.items.findIndex(
			(item) => item.bookId.toString() === bookId
		);

		if (itemIndex === -1) {
			const error = getErrorResponse('CART_ITEM_NOT_FOUND');
			return res.status(error.status).json({
				success: false,
				error: error.message,
				code: error.code,
			});
		}

		// Check book stock
		const book = await Book.findById(bookId);
		if (!book) {
			const error = getErrorResponse('BOOK_NOT_FOUND');
			return res.status(error.status).json({
				success: false,
				error: error.message,
				code: error.code,
			});
		}

		if (book.stock < quantity) {
			return res.status(400).json({
				success: false,
				error: `Insufficient stock. Only ${book.stock} items available`,
				code: 'INSUFFICIENT_STOCK',
			});
		}

		// Update quantity
		cart.items[itemIndex].quantity = quantity;
		cart.items[itemIndex].price = book.price; // Update price in case it changed

		// Calculate total and save
		cart.calculateTotal();
		await cart.save();

		// Populate book details
		await cart.populate({
			path: 'items.bookId',
			select: 'title author price imagePath stock',
		});

		return res.status(200).json({
			success: true,
			message: 'Cart updated',
			cart,
		});
	} catch (error) {
		console.error('Update Cart Error:', error.message);
		const errResponse = getErrorResponse('INTERNAL_SERVER_ERROR');
		return res.status(errResponse.status).json({
			success: false,
			error: errResponse.message,
			code: errResponse.code,
		});
	}
};

/**
 * Remove item
 * @route   DELETE /api/cart/items/:bookId
 * @access  Private
 */
export const removeFromCart = async (req, res) => {
	try {
		const userId = req.userId;
		const { bookId } = req.params;

		// Find cart
		const cart = await Cart.findOne({ userId });
		if (!cart) {
			const error = getErrorResponse('CART_NOT_FOUND');
			return res.status(error.status).json({
				success: false,
				error: error.message,
				code: error.code,
			});
		}

		// Find item index
		const itemIndex = cart.items.findIndex(
			(item) => item.bookId.toString() === bookId
		);

		if (itemIndex === -1) {
			const error = getErrorResponse('CART_ITEM_NOT_FOUND');
			return res.status(error.status).json({
				success: false,
				error: error.message,
				code: error.code,
			});
		}

		// Remove item
		cart.items.splice(itemIndex, 1);

		// Calculate total and save
		cart.calculateTotal();
		await cart.save();

		// Populate book details
		await cart.populate({
			path: 'items.bookId',
			select: 'title author price imagePath stock',
		});

		return res.status(200).json({
			success: true,
			message: 'Item removed from cart',
			cart,
		});
	} catch (error) {
		console.error('Remove from Cart Error:', error.message);
		const errResponse = getErrorResponse('INTERNAL_SERVER_ERROR');
		return res.status(errResponse.status).json({
			success: false,
			error: errResponse.message,
			code: errResponse.code,
		});
	}
};

/**
 * Clear cart
 * @route   DELETE /api/cart
 * @access  Private
 */
export const clearCart = async (req, res) => {
	try {
		const userId = req.userId;

		// Find and clear cart
		const cart = await Cart.findOne({ userId });
		if (!cart) {
			const error = getErrorResponse('CART_NOT_FOUND');
			return res.status(error.status).json({
				success: false,
				error: error.message,
				code: error.code,
			});
		}

		cart.items = [];
		cart.total = 0;
		await cart.save();

		return res.status(200).json({
			success: true,
			message: 'Cart cleared successfully',
			cart,
		});
	} catch (error) {
		console.error('Clear Cart Error:', error.message);
		const errResponse = getErrorResponse('INTERNAL_SERVER_ERROR');
		return res.status(errResponse.status).json({
			success: false,
			error: errResponse.message,
			code: errResponse.code,
		});
	}
};
