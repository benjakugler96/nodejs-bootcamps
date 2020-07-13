const path = require('path');
const Bootcamp = require('../models/Bootcamp');
const asyncHandler = require('../middleware/async');
const geocoder = require('../services/nodeGeocoder');
const ErrorResponse = require('../utils/errorResponse');

/**
 * @description Get all Bootcamps
 * @route GET /api/v1/bootcamps
 * @access Public
 */
exports.getBootcamps = asyncHandler(async (req, res, next) => {
	res.status(200).json(res.advancedResults);
});

/**
 * @description Get one Bootcamp
 * @route GET /api/v1/bootcamps/:id
 * @access Public
 */
exports.getBootcampById = asyncHandler(async (req, res, next) => {
	const bootcamp = await Bootcamp.findById(req.params.id);
	if (!bootcamp) throw new Error();

	res.status(200).json({
		success: true,
		data: bootcamp,
	});
});

/**
 * @description Create new Bootcamp
 * @route POST /api/v1/bootcamps/
 * @access Private
 */
exports.createBootcamp = asyncHandler(async (req, res, next) => {
	// Add user to req.body
	req.body.user = req.user.id;

	// Check published bootcamp
	const published = await Bootcamp.findOne({ user: req.user.id });

	// If the user is not an admin they can only add 1 bootcamp
	if (published && req.user.role !== 'admin') {
		return next(
			new ErrorResponse(
				`The user with id: ${req.user.id} has already published a bootcamp`,
				400
			)
		);
	}

	const newBootcamp = await Bootcamp.create(req.body);
	res.status(201).json({
		success: true,
		data: newBootcamp,
	});
});

/**
 * @description Update Bootcamp
 * @route PUT /api/v1/bootcamps/:id
 * @access Private
 */
exports.updateBootcamp = asyncHandler(async (req, res, next) => {
	let bootcamp = await Bootcamp.findById(req.params.id);

	if (!bootcamp) {
		return next(new ErrorResponse(`Bootcamp not found`, 404));
	}

	if (req.user.id !== bootcamp.user.toString() && req.user.role !== 'admin') {
		return next(new ErrorResponse(`The user is not authorized`, 404));
	}

	bootcamp = await Bootcamp.findByIdAndUpdate(req.params.id, req.body, {
		new: true,
		runValidators: true,
	});

	res.status(200).json({
		success: true,
		data: bootcamp,
	});
});

/**
 * @description Delete Bootcamp
 * @route DELETE /api/v1/bootcamps/:id
 * @access Private
 */
exports.deleteBootcamp = asyncHandler(async (req, res, next) => {
	const bootcamp = await Bootcamp.findById(req.params.id);

	if (!bootcamp) {
		return next(new ErrorResponse(`Bootcamp not found`, 404));
	}

	if (req.user.id !== bootcamp.user.toString() && req.user.role !== 'admin') {
		return next(new ErrorResponse(`The user is not authorized`, 404));
	}

	await bootcamp.remove();

	res.status(200).json({
		success: true,
		data: {},
	});
});

/**
 * @description Get Bootcamps within a radius
 * @route GET /api/v1/bootcamps/radius?zipCode=''&distance=''
 * @access Private
 */
exports.getBootcampsWithinRadius = asyncHandler(async (req, res, next) => {
	const { zipCode, distance, units = '' } = req.query;

	// Get latitud and logitud from geocoder
	const loc = await geocoder.geocode(zipCode);
	const latitude = loc[0].latitude;
	const longitude = loc[0].longitude;

	// Calculate radius in rad
	// Divide distance by radius of the earth
	const earthRadius = {
		unit: 'km',
		value: 6378,
	};
	const radius = distance / earthRadius.value;

	const bootcamps = await Bootcamp.find({
		location: {
			$geoWithin: { $centerSphere: [[longitude, latitude], radius] },
		},
	});

	res.status(200).json({
		success: true,
		count: bootcamps.length,
		data: bootcamps,
	});
});

/**
 * @description Upload bootcamp photo
 * @route PUT /api/v1/bootcamps/:id/photo
 * @access Private
 */
exports.addBootcampPhoto = asyncHandler(async (req, res, next) => {
	const bootcamp = await Bootcamp.findById(req.params.id);

	if (!bootcamp) {
		return next(new ErrorResponse(`Bootcamp not found`, 404));
	}

	if (req.user.id !== bootcamp.user.toString() && req.user.role !== 'admin') {
		return next(new ErrorResponse(`The user is not authorized`, 404));
	}

	if (!req.files) {
		return next(new ErrorResponse('Please upload a file', 400));
	}

	// Check if its an image
	const file = req.files.file;

	if (!file.mimetype.includes('image')) {
		return next(new ErrorResponse('Invalid file type', 400));
	}

	// Check file size
	if (file.size > process.env.MAX_FILE_SIZE) {
		return next(
			new ErrorResponse(`File size less than ${process.env.MAX_FILE_SIZE}`, 400)
		);
	}

	// Create custome filename
	file.name = `photo_${bootcamp._id}${path.parse(file.name).ext}`;
	console.log('file name', file.name);

	file.mv(`${process.env.FILES_PATH}/${file.name}`, async (err) => {
		if (err) {
			console.error(err);
			return next(new ErrorResponse('Problem with file upload.', 500));
		}
	});

	await Bootcamp.findByIdAndUpdate(req.params.id, {
		photo: file.name,
	});

	res.status(200).json({
		success: true,
		data: file.name,
	});
});
