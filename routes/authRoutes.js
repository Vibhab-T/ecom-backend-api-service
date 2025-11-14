import express from 'express';
import {
	loginUser,
	logoutUser,
	registerUser,
} from '../controllers/authController.js';
import { protectRoute } from '../middlewares/authMiddleware.js';
import { validateLogin, validateRegister } from '../middlewares/validation.js';

const router = express.Router();

//public routes, no auth required
router.post('/register', validateRegister, registerUser);
router.post('/login', validateLogin, loginUser);
router.post('/logout', logoutUser);

//private routes, requires auth
router.get('/me', protectRoute, async (req, res) => {
	res.json({
		success: true,
		user: req.user,
	});
});

export default router;
