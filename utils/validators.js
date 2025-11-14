export const validateEmail = (email) => {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
};

export const validatePassword = (password) => {
	// At least 6 characters
	return password && password.length >= 6;
};

export const validateName = (name) => {
	return name && name.trim().length >= 2;
};

export const validatePrice = (price) => {
	return price && !isNaN(price) && price >= 0;
};

export const validateBookData = (data) => {
	const errors = {};

	if (!data.title || !data.title.trim()) {
		errors.title = 'Title is required';
	}

	if (!data.author || !data.author.trim()) {
		errors.author = 'Author is required';
	}

	if (!validatePrice(data.price)) {
		errors.price = 'Valid price is required';
	}

	if (!data.imagePath) {
		errors.imagePath = 'Image path is required';
	}

	return { isValid: Object.keys(errors).length === 0, errors };
};
