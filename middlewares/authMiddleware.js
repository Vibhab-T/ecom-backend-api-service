import jwt, { decode } from 'jsonwebtoken';
import User from '../models/user.js';
import { ERROR_CODES } from '../constants/errors.js';

/**
 * protect routes, verify jwt token from the cookie
 * extract the user from the token, which is extracted from the cookie.
 * attach user to the request then
 */

export const protectRoute = async (req, res, next) => {
	try {
		//get token from cookie
		const token = req.cookies.jwt;

		//check token existence
		if (!token) {
			const errResp = ERROR_CODES.AUTH_NO_TOKEN;
			return res.status(errResp.status).json({
				success: false,
				error: errResp.message,
				code: errResp.code,
			});
		}

		//verify token
		let decoded;
		try {
			decoded = jwt.verify(token, process.env.JWT_SECRET);
		} catch (error) {
			const errRespoonse = ERROR_CODES.AUTH_INVALID_TOKEN;
			return res.status(errRespoonse.status).json({
				success: false,
				error: errRespoonse.message,
				code: errRespoonse.code,
			});
		}

		if (!decoded || !decoded.userId) {
			const error = ERROR_CODES.AUTH_INVALID_TOKEN;
			return res.status(error.status).json({
				success: false,
				error: error.message,
				code: error.code,
			});
		}

		//find user and attach to request
		const user = await User.findById(decoded.userId).select('-passwordHash');

		if (!user) {
			const error = ERROR_CODES.AUTH_USER_NOT_FOUND;
			return res.status(error.status).json({
				success: false,
				error: error.message,
				code: error.code,
			});
		}

		req.user = user;
		req.userId = user._id;

		//next middleware
		next();
	} catch (error) {
		console.error('Auth Middleware Error: ', error.message);
		const errResponse = ERROR_CODES.INTERNAL_SERVER_ERROR;
		return res.status(errResponse.status).json({
			success: false,
			error: errResponse.message,
			code: errResponse.code,
		});
	}
};

/**
 * admin check middleware
 * not implemented yet
 */
export const adminOnly = (req, res, next) => {
	if (!req.user.isAdmin) {
		return res.status(403).json({
			success: false,
			error: 'Access denied, Admin privileges required',
			code: 'ADMIN_ONLY',
		});
	}

	next();
};
