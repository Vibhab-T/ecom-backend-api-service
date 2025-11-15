import express from 'express';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import cors from 'cors';
import connectToMongoDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import bookRoutes from './routes/bookRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import { errorHandler } from './middlewares/errorHandlers.js';
import { requestLogger } from './middlewares/logger.js';

//load env variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

//middlewares
app.use(cors());
app.use(express.json());
app.use(cookieParser());

//cors configuration
app.use(
	cors({
		origin: process.env.CLIENT_URL || 'http://localhost:3000',
		credentials: true,
	})
);

//request logging middleware - cool little thing man
app.use(requestLogger);

//routes
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);

//health check
app.get('/health', (req, res) => {
	res.status(200).json({
		succes: true,
		message: 'Server is running',
		timestamp: new Date().toISOString(),
	});
});

//root route
app.use('/', (req, res) => {
	res.send(`<h1>BACKEND RUNNING ON PORT ${PORT}</h1>`);
});

//404 handler for routes undefined
app.use('/{*any}', (req, res) => {
	res.status(404).json({
		sucess: false,
		error: 'Route not found',
		code: 'ROUTE_NOT_FOUND',
	});
});

//error handling middleware must be last
app.use(errorHandler);

app.listen(PORT, async () => {
	try {
		await connectToMongoDB();
		console.log(`Server running on port: ${PORT}`);
	} catch (error) {
		console.log('ERROR STARTING SERVER!!! \n\n', error.message);
	}
});

//handle promise rejections that were unhandled
process.on('unhandledRejection', (err) => {
	console.error('UNHANDLED REJECTION, SHUTTING DOWN!!');
	console.error(err.name, err.message);
	process.exit(1);
});

//handle exceptions uncaught
process.on('uncaughtException', (err) => {
	console.error('UNCAUGHT EXCEPTION, SHUTTING DOWN');
	console.error(err.name, err.message);
	process.exit(1);
});
