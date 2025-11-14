import {
	validateEmail,
	validatePassword,
	validateBookData,
} from '../utils/validators.js';

/**
 * Validate registration data
 */
export const validateRegister = (req, res, next) => {
	const { name, email, password } = req.body;
	const errors = [];

	if (!name || name.trim().length < 2) {
		errors.push('Name must be at least 2 characters long');
	}

	if (!validateEmail(email)) {
		errors.push('Invalid email format');
	}

	if (!validatePassword(password)) {
		errors.push('Password must be at least 6 characters long');
	}

	if (errors.length > 0) {
		return res.status(400).json({
			success: false,
			error: 'Validation failed',
			details: errors,
		});
	}

	next();
};

/**
 * Validate login data
 */
export const validateLogin = (req, res, next) => {
	const { email, password } = req.body;
	const errors = [];

	if (!email) {
		errors.push('Email is required');
	}

	if (!password) {
		errors.push('Password is required');
	}

	if (errors.length > 0) {
		return res.status(400).json({
			success: false,
			error: 'Validation failed',
			details: errors,
		});
	}

	next();
};

/**
 * Validate book data
 */
export const validateBook = (req, res, next) => {
	const validation = validateBookData(req.body);

	if (!validation.isValid) {
		return res.status(400).json({
			success: false,
			error: 'Validation failed',
			details: validation.errors,
		});
	}

	next();
};

/**
 * Validate MongoDB ObjectId
 */
export const validateObjectId = (paramName) => {
	return (req, res, next) => {
		const id = req.params[paramName];
		const isValid = /^[0-9a-fA-F]{24}$/.test(id);

		if (!isValid) {
			return res.status(400).json({
				success: false,
				error: 'Invalid ID format',
				code: 'INVALID_ID',
			});
		}

		next();
	};
};
