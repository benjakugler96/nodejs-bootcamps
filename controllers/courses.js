const Course = require('../models/Course');
const Bootcamp = require('../models/Bootcamp');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

/**
 * @description Get all Courses
 * @route GET /api/v1/courses
 * @route GET /api/v1/bootcamps/:bootcampId/courses
 * @access Public
 */
exports.getCourses = asyncHandler(async (req, res, next) => {
	if (req.params.bootcampId) {
		const courses = await Course.find({ bootcamp: req.params.bootcampId });
		return res.status(200).json({
			success: true,
			count: courses.length,
			data: courses,
		});
	} else {
		res.status(200).json(res.advancedResults);
	}
});

/**
 * @description Get one Course
 * @route GET /api/v1/courses/:courseId
 * @access Public
 */
exports.getCourse = asyncHandler(async (req, res, next) => {
	const course = await Course.findById(req.params.courseId).populate({
		path: 'bootcamp',
		select: 'name description',
	});

	if (!course) {
		return next(
			new ErrorResponse(`Course with id ${req.params.courseId} not found`, 404)
		);
	}

	res.status(200).json({
		success: true,
		count: course.length,
		data: course,
	});
});

/**
 * @description Create Course
 * @route POST /api/v1/bootcamps/:bootcampId/courses
 * @access Private
 */
exports.addCourse = asyncHandler(async (req, res, next) => {
	req.body.bootcamp = req.params.bootcampId;
	req.body.user = req.user.id;

	const bootcamp = await Bootcamp.findById(req.body.bootcamp);
	if (!bootcamp) {
		return next(
			new ErrorResponse(`No bootcamp with id ${req.body.bootcamp}`, 404)
		);
	}

	if (req.user.id !== bootcamp.user.toString() && req.user.role !== 'admin') {
		return next(new ErrorResponse(`The user is not authorized`, 404));
	}

	const course = await Course.create(req.body);

	res.status(200).json({
		success: true,
		data: course,
	});
});

/**
 * @description Update Course
 * @route PUT /api/v1/courses/:courseId/
 * @access Private
 */
exports.updateCourse = asyncHandler(async (req, res, next) => {
	const { courseId } = req.params;

	let course = await Course.findById(courseId);
	if (!course) {
		return next(new ErrorResponse(`No Course with id ${courseId} `, 404));
	}

	if (req.user.id !== course.user.toString() && req.user.role !== 'admin') {
		return next(new ErrorResponse(`The user is not authorized`, 404));
	}

	course = await Course.findByIdAndUpdate(courseId, req.body, {
		new: true,
		runValidators: true,
	});

	res.status(200).json({
		success: true,
		data: course,
	});
});

/**
 * @description Delete Course
 * @route DELETE /api/v1/courses/:courseId/
 * @access Private
 */
exports.deleteCourse = asyncHandler(async (req, res, next) => {
	const { courseId } = req.params;

	const course = await Course.findById(courseId);
	if (!course) {
		return next(new ErrorResponse(`No Course with id ${courseId} `, 404));
	}

	if (req.user.id !== course.user.toString() && req.user.role !== 'admin') {
		return next(new ErrorResponse(`The user is not authorized`, 404));
	}

	await course.remove();

	res.status(200).json({
		success: true,
		data: {},
	});
});
