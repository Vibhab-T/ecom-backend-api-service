import mongoose from 'mongoose';

const bookSchema = new mongoose.Schema(
	{
		title: {
			type: String,
			required: [true, 'Title is required'],
			trim: true,
			maxlength: [200, 'Title cannot exceed 200 characters'],
		},
		author: {
			type: String,
			required: [true, 'Author is required'],
			trim: true,
		},
		price: {
			type: Number,
			required: [true, 'Price is required'],
			min: [0, 'Price cannot be negative'],
		},
		description: {
			type: String,
			trim: true,
			maxlength: [2000, 'Description cannot exceed 2000 characters'],
		},
		imagePath: {
			type: String,
			required: [true, 'Image path is required'],
		},
		stock: {
			type: Number,
			default: 0,
			min: [0, 'Stock cannot be negative'],
		},
		category: {
			type: String,
			enum: [
				'Fiction',
				'Non-Fiction',
				'Science',
				'History',
				'Biography',
				'Other',
			],
			default: 'Other',
		},
		rating: {
			type: Number,
			default: 0,
			min: 0,
			max: 5,
		},
	},
	{ timestamps: true }
);

// Index for faster searches
bookSchema.index({ title: 'text', author: 'text' });
bookSchema.index({ category: 1 });

const Book = mongoose.model('Book', bookSchema);

export default Book;
