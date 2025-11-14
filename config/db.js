import mongoose from 'mongoose';

const connectToMongoDB = async () => {
	try {
		console.log('MongoDB connection....');
		await mongoose.connect(process.env.MONGO_URI);
		console.log('Sucess');
	} catch (error) {
		console.log('Failed');
		console.log('\nError: ', error.message);
		process.exit(1);
	}
};

export default connectToMongoDB;
