const express = require('express');
const router = express.Router({ mergeParams: true });

const Course = require('../models/Course');

const {
	addCourse,
	deleteCourse,
	getCourse,
	getCourses,
	updateCourse,
} = require('../controllers/courses');

const advancedResults = require('../middleware/advancedResults');
const { protect } = require('../middleware/auth');

// This is the other way to define routes
router
	.route('/')
	.get(
		advancedResults(Course, {
			path: 'bootcamp',
			select: 'name description',
		}),
		getCourses
	)
	.post(protect, addCourse);
router
	.route('/:courseId')
	.get(getCourse)
	.put(protect, updateCourse)
	.delete(protect, deleteCourse);

module.exports = router;
