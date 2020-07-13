const ErrorResponse = require('../utils/errorResponse');

const errorHandler = (err, req, res, next) => {
	let error = { ...err };
	console.log(err);

	// Bad object id
	if (err.name === 'CastError') {
		const message = `Resource not found with id of ${err.value}`;
		error = new ErrorResponse(message, 404);
	}

	// Duplicate key
	if (err.code === 11000) {
		const message = `Duplicate field value.`;
		error = new ErrorResponse(message, 400);
	}

	if (err.name === 'ValidationError') {
		const messages = Object.values(err.errors).map((val) => val.message);
		error = new ErrorResponse(messages, 400);
	}

	res.status(error.statusCode || 500).json({
		success: false,
		error: error.message || 'Server Error',
	});
};

module.exports = errorHandler;
