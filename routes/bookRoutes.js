import express from 'express';
import {
	addBook,
	deleteBook,
	getBookById,
	getBooks,
	searchBooks,
	updateBook,
} from '../controllers/bookController.js';
import { protectRoute } from '../middlewares/authMiddleware.js';
import { validateBook, validateObjectId } from '../middlewares/validation.js';

const router = express.Router();

//public routes, no auth required
router.get('/search', searchBooks);
router.get('/', getBooks);
router.get('/:id', validateObjectId('id'), getBookById);

//privtate routes, auth required
router.post('/', protectRoute, validateBook, addBook);
router.put('/:id', protectRoute, validateObjectId('id'), updateBook);
router.delete('/:id', protectRoute, validateObjectId('id'), deleteBook);

export default router;
