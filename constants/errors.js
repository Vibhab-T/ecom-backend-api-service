export const ERROR_CODES = {
	// Auth errors
	AUTH_MISSING_FIELDS: {
		code: 'AUTH_001',
		message: 'All fields are required',
		status: 400,
	},
	AUTH_INVALID_EMAIL: {
		code: 'AUTH_002',
		message: 'Invalid email format',
		status: 400,
	},
	AUTH_USER_EXISTS: {
		code: 'AUTH_003',
		message: 'User already exists',
		status: 400,
	},
	AUTH_INVALID_CREDENTIALS: {
		code: 'AUTH_004',
		message: 'Invalid login credentials',
		status: 400,
	},
	AUTH_USER_NOT_FOUND: {
		code: 'AUTH_005',
		message: 'User not found',
		status: 404,
	},
	AUTH_NO_TOKEN: {
		code: 'AUTH_006',
		message: 'Unauthorized: no token provided',
		status: 401,
	},
	AUTH_INVALID_TOKEN: {
		code: 'AUTH_007',
		message: 'Unauthorized: invalid token',
		status: 401,
	},

	// Book errors
	BOOK_NOT_FOUND: { code: 'BOOK_001', message: 'Book not found', status: 404 },
	BOOK_VALIDATION_ERROR: {
		code: 'BOOK_002',
		message: 'Invalid book data',
		status: 400,
	},
	BOOK_DELETE_ERROR: {
		code: 'BOOK_003',
		message: 'Error deleting book',
		status: 500,
	},

	// Cart errors
	CART_NOT_FOUND: { code: 'CART_001', message: 'Cart not found', status: 404 },
	CART_ITEM_NOT_FOUND: {
		code: 'CART_002',
		message: 'Item not in cart',
		status: 404,
	},
	CART_INVALID_QUANTITY: {
		code: 'CART_003',
		message: 'Invalid quantity',
		status: 400,
	},

	// Server errors
	INTERNAL_SERVER_ERROR: {
		code: 'SERVER_001',
		message: 'Internal server error',
		status: 500,
	},

	//Search errors
	SEARCH_INVALID_QUERY: {
		code: 'SEARCH_001',
		message: 'Search query is required',
		status: 400,
	},
	SEARCH_NO_RESULTS: {
		code: 'SEARCH_002',
		message: 'No results found',
		status: 404,
	},

	//Order errors
	ORDER_NOT_FOUND: {
		code: 'ORDER_001',
		message: 'Order not found',
		status: 404,
	},
	ORDER_STOCK_ERROR: {
		code: 'ORDER_002',
		message: 'Not enough stock for item',
		status: 400,
	},
};

export const getErrorResponse = (errorKey) => {
	return ERROR_CODES[errorKey] || ERROR_CODES.INTERNAL_SERVER_ERROR;
};
