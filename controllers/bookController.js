import Book from '../models/book.js';
import { getErrorResponse } from '../constants/errors.js';
import { SUCCESS_MESSAGES } from '../constants/messages.js';

/**
 * @route GET /api/books/
 * @access Public
 */
export const getBooks = async (req, res) => {
	try {
		const books = await Book.find();

		//send with count
		res.status(200).json({
			success: true,
			count: books.length,
			books,
		});
	} catch (error) {
		console.error('Get books error:', error.message);
		const errResponse = getErrorResponse('INTERNAL_SERVER_ERROR');
		return res.status(errResponse.status).json({
			success: false,
			error: errResponse.message,
			code: errResponse.code,
		});
	}
};

/**
 * @route GET /api/books/:bookId
 * @access Public
 */
export const getBookById = async (req, res) => {
	try {
		const bookToFindId = req.params.id;

		//search by id
		const book = await Book.findById(bookToFindId);

		//return error if no book
		if (!book) {
			const error = getErrorResponse('BOOK_NOT_FOUND');
			return res.status(error.status).json({
				success: false,
				error: error.message,
				code: error.code,
			});
		}

		//else return book
		res.status(200).json({
			success: true,
			book,
		});
	} catch (error) {
		console.error('Get book by ID error:', error.message);
		const errResponse = getErrorResponse('INTERNAL_SERVER_ERROR');
		return res.status(errResponse.status).json({
			success: false,
			error: errResponse.message,
			code: errResponse.code,
		});
	}
};

/**
 * @route POST /api/books/
 * @access Private
 */
export const addBook = async (req, res) => {
	try {
		const { title, author, price, description, imagePath } = req.body;

		//create new book
		const newBook = await new Book({
			title: title,
			author: author,
			price: price,
			description: description,
			imagePath: imagePath,
		});

		//save new book
		if (newBook) {
			await newBook.save();
		}

		//return success
		return res.status(201).json({
			success: true,
			message: SUCCESS_MESSAGES.BOOK_CREATED,
			book: newBook,
		});
	} catch (error) {
		console.error('Add book error:', error.message);
		const errResponse = getErrorResponse('INTERNAL_SERVER_ERROR');
		return res.status(errResponse.status).json({
			success: false,
			error: errResponse.message,
			code: errResponse.code,
		});
	}
};

/**
 * @route PUT /api/books/:bookId
 * @access Private
 */
export const updateBook = async (req, res) => {
	try {
		const bookId = req.params.id;

		//find book by id
		const bookToUpdate = await Book.findById(bookId);

		//return error if no book found
		if (!bookToUpdate) {
			const error = getErrorResponse('BOOK_NOT_FOUND');
			return res.status(error.status).json({
				success: false,
				error: error.message,
				code: error.code,
			});
		}

		//update the book
		const updatedData = req.body;
		Object.assign(bookToUpdate, updatedData);

		//save updated book
		await bookToUpdate.save();

		//return sucess
		return res.status(200).json({
			success: true,
			message: SUCCESS_MESSAGES.BOOK_UPDATED,
			book: bookToUpdate,
		});
	} catch (error) {
		console.error('Update book error:', error.message);
		const errResponse = getErrorResponse('INTERNAL_SERVER_ERROR');
		return res.status(errResponse.status).json({
			success: false,
			error: errResponse.message,
			code: errResponse.code,
		});
	}
};

/**
 * @route DELETE /api/books/:bookId
 * @access Private
 */
export const deleteBook = async (req, res) => {
	try {
		const bookId = req.params.id;

		//find book
		const bookToDelete = await Book.findById(bookId);

		//return error if no book found
		if (!bookToDelete) {
			const error = getErrorResponse('BOOK_NOT_FOUND');
			return res.status(error.status).json({
				success: false,
				error: error.message,
				code: error.code,
			});
		}

		//delete book
		await bookToDelete.deleteOne();

		//return success
		return res.status(200).json({
			success: true,
			message: SUCCESS_MESSAGES.BOOK_DELETED,
		});
	} catch (error) {
		console.error('Delete book error:', error.message);
		const errResponse = getErrorResponse('INTERNAL_SERVER_ERROR');
		return res.status(errResponse.status).json({
			success: false,
			error: errResponse.message,
			code: errResponse.code,
		});
	}
};
