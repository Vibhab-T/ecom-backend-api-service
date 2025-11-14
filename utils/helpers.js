/**
 * pagination metadata
 * @param {number} page = current page
 * @param {number} limit = items per page
 * @param {number} total = total items
 * @returns {object} pagination metadata
 */
export const getPaginationMetadata = (page, limit, total) => {
	return {
		currentPage: parseInt(page),
		totalPages: Math.ceil(total / parseInt(limit)),
		totalItems: total,
		itemsPerPage: parseInt(limit),
		hasNextPage: page * limit < total,
		hasPreviousPage: page > 1,
	};
};
