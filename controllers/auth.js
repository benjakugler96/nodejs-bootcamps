const crypto = require('crypto');
const path = require('path');

const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const sendEmail = require('../utils/sendEmail');
const User = require('../models/User');

/**
 * @description Register user
 * @route POST /api/v1/auth/register
 * @access Public
 */
exports.register = asyncHandler(async (req, res, next) => {
	const { name, email, password, role } = req.body;

	const user = await User.create({
		name,
		email,
		password,
		role,
	});

	sendTokenResponse(user, 200, res);
});

/**
 * @description Login user
 * @route POST /api/v1/auth/login
 * @access Public
 */
exports.login = asyncHandler(async (req, res, next) => {
	const { email, password } = req.body;

	// Validate email and password;
	if (!email || !password) {
		return next(new ErrorResponse('Please provide an email and password', 400));
	}

	// Check for user. select+password is because in schema, password has selected: false
	const user = await User.findOne({ email }).select('+password');
	if (!user) {
		return next(new ErrorResponse('Invalid credentials', 401));
	}

	const isMatch = await user.checkPassword(password);
	if (!isMatch) {
		return next(new ErrorResponse('Invalid credentials', 401));
	}

	sendTokenResponse(user, 200, res);
});

/**
 * @description Log user out / clear clookie
 * @route GET /api/v1/auth/logout
 * @access Private
 */
exports.logout = asyncHandler(async (req, res, next) => {
	res.cookie('token', 'none', {
		expires: new Date(Date.now() + 10 * 1000),
		httpOnly: true,
	});

	res.status(200).json({
		success: true,
		data: {},
	});
});

/**
 * @description Get loged in user
 * @route GET /api/v1/auth/me
 * @access Private
 */
exports.getMe = asyncHandler(async (req, res, next) => {
	const user = await User.findById(req.user.id);
	console.log(req.user);

	res.status(200).json({
		success: true,
		data: user,
	});
});

/**
 * @description Forgot password
 * @route GET /api/v1/auth/forgotpassword
 * @access Public
 */
exports.forgotPassword = asyncHandler(async (req, res, next) => {
	const user = await User.findOne({ email: req.body.email });

	if (!user) {
		return next(new ErrorResponse('There is no user with that email', 404));
	}

	const resetToken = await user.getResetPasswordToken();
	console.log(resetToken);

	// Reset URL
	const resetUrl = `${req.protocol}://${req.get(
		'host'
	)}/api/v1/auth/resetpassword/${resetToken}`;

	// Message
	const message = `You are receiving this email because you requested a password reset.
		Pleas follow this link: \n\n${resetUrl}`;

	try {
		await sendEmail({
			subject: 'Password Reset Token',
			text: message,
			to: req.body.email,
		});

		await user.save({ validateBeforeSave: false });

		return res.status(200).json({
			success: true,
			data: 'Email sent',
		});
	} catch (err) {
		console.error(err);
		user.resetPasswordToken = undefined;
		user.resetPasswordExpire = undefined;

		await user.save({ validateBeforeSave: false });

		return next(
			new ErrorResponse('There was a problem while sending the email', 500)
		);
	}
});

/**
 * @description Reset Password
 * @route GET /api/v1/auth/resetpassword/:resetToken
 * @access Public
 */
exports.resetPassword = asyncHandler(async (req, res, next) => {
	// Get hashed token
	const resetPasswordToken = crypto
		.createHash('sha256')
		.update(req.params.resetToken)
		.digest('hex');

	// Find user by reset token
	const user = await User.findOne({
		resetPasswordToken,
		resetPasswordExpire: { $gt: Date.now() },
	});

	if (!user) {
		return next(new ErrorResponse('Invalid token', 400));
	}

	user.password = req.body.password;
	user.resetPasswordToken = undefined;
	user.resetPasswordExpire = undefined;
	await user.save();

	sendTokenResponse(user, 200, res);
});

// Get token from model, set to cookie and send the response
const sendTokenResponse = (user, statusCode, res) => {
	// Create token
	const token = user.getSignedJwt();

	const options = {
		expires: new Date(
			Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
		),
		httpOnly: true,
	};

	if (process.env.NODE_ENV === 'production') {
		options.secure = true;
	}

	res.status(statusCode).cookie('token', token, options).json({
		success: true,
		token,
	});
};
