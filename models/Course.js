const { Schema, model } = require('mongoose');

const CourseSchema = new Schema({
	title: {
		type: String,
		trim: true,
		required: [true, 'Please add a course Title.'],
	},
	description: {
		type: String,
		required: [true, 'Please add a course Description.'],
	},
	weeks: {
		type: String,
		required: [true, 'Please add number of weeks.'],
	},
	tuition: {
		type: Number,
		required: [true, 'Please add a Tuition cost.'],
	},
	minSkills: {
		type: String,
		required: [true, 'Please add min Skills required.'],
		enum: ['beg', 'int', 'adv'],
	},
	scholarshipAvailable: {
		type: Boolean,
		default: false,
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
	bootcamp: {
		type: Schema.Types.ObjectId,
		ref: 'Bootcamp',
		required: [true, 'Add bootcamp related to this course.'],
	},
	user: {
		type: Schema.Types.ObjectId,
		ref: 'User',
		required: [true, 'Add User related to this course.'],
	},
});

module.exports = model('Course', CourseSchema);
