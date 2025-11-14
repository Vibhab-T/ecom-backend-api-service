import jwt from 'jsonwebtoken';

export const generateToken = (userId) => {
	return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '15d' });
};

export const genCookieAndSetToken = (userId, res) => {
	const token = generateToken(userId);

	res.cookie('jwt', token, {
		maxAge: 15 * 24 * 60 * 60 * 1000,
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'strict',
	});

	return token;
};

export default genCookieAndSetToken;
