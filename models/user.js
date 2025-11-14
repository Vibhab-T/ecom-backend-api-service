import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: [true, 'Name is required'],
			trim: true,
			minlength: [2, 'Name must be at least 2 characters'],
			maxlength: [50, 'Name cannot exceed 50 characters'],
		},
		email: {
			type: String,
			required: [true, 'Email is required'],
			unique: true,
			lowercase: true,
			trim: true,
			match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email'],
		},
		passwordHash: {
			type: String,
			required: [true, 'Password is required'],
			minlength: 6,
		},
		phoneNumber: {
			type: String,
			match: [/^\+?[\d\s-()]+$/, 'Please provide a valid phone number'],
		},
		isAdmin: {
			type: Boolean,
			default: false,
		},
		isActive: {
			type: Boolean,
			default: true,
		},
		addresses: [
			{
				fullName: String,
				phoneNumber: String,
				address: String,
				city: String,
				state: String,
				zipCode: String,
				country: { type: String, default: 'USA' },
				isDefault: { type: Boolean, default: false },
			},
		],
		wishlist: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'Book',
			},
		],
		resetPasswordToken: String,
		resetPasswordExpire: Date,
		lastLogin: Date,
	},
	{
		timestamps: true,
	}
);

// Index for faster email lookups
userSchema.index({ email: 1 });

// Virtual for orders
userSchema.virtual('orders', {
	ref: 'Order',
	localField: '_id',
	foreignField: 'userId',
});

// Method to update last login
userSchema.methods.updateLastLogin = function () {
	this.lastLogin = new Date();
	return this.save();
};

const User = mongoose.model('User', userSchema);

export default User;
