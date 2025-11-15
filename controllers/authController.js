import User from '../models/user.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import genTokenAndSetCookie, {
	generateToken,
} from '../utils/genTokenAndSetCookie.js';
import { getErrorResponse } from '../constants/errors.js';
import { SUCCESS_MESSAGES } from '../constants/messages.js';

/**
 * Register new user
 * @route POST /api/auth/register
 * @access Public
 */
export const registerUser = async (req, res) => {
	try {
		const { name, email, password } = req.body;

		//check for existing user
		const existing = await User.findOne({ email });
		if (existing) {
			const error = getErrorResponse('AUTH_USER_EXISTS');
			return res.status(error.status).json({
				success: false,
				error: error.message,
				code: error.code,
			});
		}

		//hash the password
		const passwordHash = await bcrypt.hash(password, 10);

		//create user
		const newUser = new User({
			name: name,
			email: email,
			passwordHash: passwordHash,
		});

		//save user to database
		if (newUser) {
			await newUser.save();

			//generate token and set cookie, sorry for the opposite function name, boo
			genTokenAndSetCookie(newUser._id, res);

			//return success with user and token
			return res.status(201).json({
				success: true,
				message: SUCCESS_MESSAGES.AUTH_REGISTER_SUCCESS,
				user: {
					id: newUser._id,
					name: newUser.name,
					email: newUser.email,
				},
			});
		}
	} catch (error) {
		console.error('Register error:', error.message);
		const errResponse = getErrorResponse('INTERNAL_SERVER_ERROR');
		return res.status(errResponse.status).json({
			success: false,
			error: errResponse.message,
			code: errResponse.code,
		});
	}
};
/**
 * Login user
 * @route POST /api/auth/login
 * @access Public
 */
export const loginUser = async (req, res) => {
	try {
		const { email, password } = req.body;

		//find user
		const user = await User.findOne({ email });

		//return error if no user exists
		if (!user) {
			const error = getErrorResponse('AUTH_USER_NOT_FOUND');
			return res.status(error.status).json({
				success: false,
				error: error.message,
				code: error.code,
			});
		}

		//else compare passwords
		const isMatch = await bcrypt.compare(password, user.passwordHash);

		//if passwords dont match return error
		if (!isMatch) {
			const error = getErrorResponse('AUTH_INVALID_CREDENTIALS');
			return res.status(error.status).json({
				success: false,
				error: error.message,
				code: error.code,
			});
		}

		//generate jwt token
		genTokenAndSetCookie(user._id, res);

		//update last login
		user.lastLogin = new Date();
		await user.save();

		//return success message alongside user and token
		return res.status(200).json({
			success: true,
			message: SUCCESS_MESSAGES.AUTH_LOGIN_SUCCESS,
			user: {
				id: user._id,
				name: user.name,
				email: user.email,
			},
		});
	} catch (error) {
		console.error('Login error:', error.message);
		const errResponse = getErrorResponse('INTERNAL_SERVER_ERROR');
		return res.status(errResponse.status).json({
			success: false,
			error: errResponse.message,
			code: errResponse.code,
		});
	}
};

/**
 * Logout user
 * @route POST /api/auth/logout
 * @access Public
 */
export const logoutUser = async (req, res) => {
	try {
		res.cookie('jwt', '', { maxAge: 0 });
		res.status(200).json({
			success: true,
			message: SUCCESS_MESSAGES.AUTH_LOGOUT_SUCCESS,
		});
	} catch (error) {
		console.error('Logout error:', error.message);
		const errResponse = getErrorResponse('INTERNAL_SERVER_ERROR');
		return res.status(errResponse.status).json({
			success: false,
			error: errResponse.message,
			code: errResponse.code,
		});
	}
};
