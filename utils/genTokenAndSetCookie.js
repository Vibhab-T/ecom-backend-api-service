import jwt from 'jsonwebtoken';

/**
 * Generate jwt token
 * @param {string} userId = User id to encoed in the token
 * @returns {string} JWT token
 */
export const generateToken = (userId) => {
	return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '15d' });
};

/**
 * set the jwt token and gen the cookie, the naming is opposite through no fault of my own, oops
 * @param {string} userId = User id to encode in the token
 * @param {object} res = express ko respone objeck aka response, idk what elso to say about it
 * @return {string} the gen token
 */
export const genTokenAndSetCookie = (userId, res) => {
	const token = generateToken(userId);

	res.cookie('jwt', token, {
		maxAge: 15 * 24 * 60 * 60 * 1000, //15 days milis
		httpOnly: true, //xss - cross site scripting ko biruddha samrakhsan garne
		secure: process.env.NODE_ENV === 'production', //only send cookies over http in production
		sameSite: 'strict', //csrf protection - cross site requst forgery vancha kyare
	});

	return token;
};

export default genTokenAndSetCookie;
