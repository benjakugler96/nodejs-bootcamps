const advancedResults = (model, populate) => async (req, res, next) => {
	// Advanced filtering with mongoose operators
	let query;

	// Copy req.query
	const queryCopy = { ...req.query };

	// Create array of fields to exclude from filtering
	const removeFields = ['select', 'sort', 'limit', 'page'];

	// Loop over removeFields and delete them from queryCopy
	removeFields.forEach((param) => delete queryCopy[param]);

	// Create query string
	let queryStr = JSON.stringify(queryCopy);

	// Create operators like $gt || $lte
	queryStr = queryStr.replace(
		/\b(gt|gte|lt|lte|in)\b/g,
		(match) => `$${match}`
	);

	// Finding resource
	query = model.find(JSON.parse(queryStr));

	// Select fields
	if (req.query.select) {
		const fields = req.query.select.split(',').join(' ');
		query = query.select(fields);
	}

	// Sort
	if (req.query.sort) {
		const sortBy = req.query.sort.split(',').join(' ');
		query = query.sort(sortBy);
	} else {
		query = query.sort('-createdAt');
	}

	// Populate
	if (populate) {
		query = query.populate(populate);
	}

	// Pagination
	const page = parseInt(req.query.page, 10) || 1;
	const limit = parseInt(req.query.limit, 10) || 5;
	const startIndex = (page - 1) * limit;
	const endIndex = page * limit;
	const totalDocs = await model.countDocuments();
	query = query.skip(startIndex).limit(limit);

	// Exec our query
	const results = await query;

	//Pagination results
	const pagination = {};
	if (endIndex < totalDocs) {
		pagination.next = {
			page: page + 1,
			limit,
		};
	}
	if (startIndex > 0) {
		pagination.prev = {
			page: page - 1,
			limit,
		};
	}

	res.advancedResults = {
		success: true,
		count: results.length,
		pagination,
		data: results,
	};

	next();
};

module.exports = advancedResults;
