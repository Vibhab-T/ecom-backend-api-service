export const errorHandler = (err, req, res, next) => {
	console.error('Error:', {
		message: err.message,
		stack: err.stack,
		path: req.path,
		method: req.method,
	});

	// Mongoose validation error
	if (err.name === 'ValidationError') {
		const messages = Object.values(err.errors).map((e) => e.message);
		return res.status(400).json({
			error: 'Validation failed',
			details: messages,
			code: 'VALIDATION_ERROR',
		});
	}

	// Mongoose duplicate key error
	if (err.code === 11000) {
		const field = Object.keys(err.keyPattern)[0];
		return res.status(400).json({
			error: `${field} already exists`,
			code: 'DUPLICATE_ERROR',
		});
	}

	// JWT errors
	if (err.name === 'JsonWebTokenError') {
		return res.status(401).json({
			error: 'Invalid token',
			code: 'JWT_ERROR',
		});
	}

	// Default error
	res.status(err.status || 500).json({
		error: err.message || 'Internal server error',
		code: err.code || 'INTERNAL_SERVER_ERROR',
	});
};
