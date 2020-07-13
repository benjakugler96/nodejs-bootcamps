const express = require('express');
const router = express.Router();

const Bootcamp = require('../models/Bootcamp');

const {
	addBootcampPhoto,
	createBootcamp,
	deleteBootcamp,
	getBootcampById,
	getBootcamps,
	getBootcampsWithinRadius,
	updateBootcamp,
} = require('../controllers/bootcamps');

const advancedResults = require('../middleware/advancedResults');
const { authorize, protect } = require('../middleware/auth');

// Include other resource router
const courseRouter = require('./courses');
router.use('/:bootcampId/courses', courseRouter);

router
	.route('/')
	.post(protect, authorize('admin', 'publisher'), createBootcamp)
	.get(advancedResults(Bootcamp, 'courses'), getBootcamps);
router
	.route('/:id')
	.delete(protect, authorize('admin'), deleteBootcamp)
	.get(getBootcampById)
	.put(protect, authorize('admin', 'publisher'), updateBootcamp);
router.route('/radius').get(getBootcampsWithinRadius);
router.route('/:id/photo').put(protect, addBootcampPhoto);

module.exports = router;
