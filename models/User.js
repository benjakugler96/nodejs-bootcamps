const { model, Schema } = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new Schema({
	name: {
		type: String,
		required: [true, 'Please add a name.'],
	},
	email: {
		type: String,
		required: [true, 'Please add an email.'],
		unique: true,
		match: [
			/(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/,
			'Phone can not be more than 20 chars.',
		],
	},
	role: {
		type: String,
		enum: ['publisher', 'user'],
		default: 'user',
	},
	password: {
		type: String,
		required: [true, 'Please add a password.'],
		minlength: 6,
		select: false, // So password is not return from api call
	},
	resetPasswordToken: String,
	resetPasswordExpire: Date,
	createdAt: {
		type: Date,
		default: Date.now,
	},
});

// Encrypt password
UserSchema.pre('save', async function (next) {
	const salt = await bcrypt.genSalt(10);
	this.password = await bcrypt.hash(this.password, salt);

	next();
});

// Sign jwt and return token
UserSchema.methods.getSignedJwt = function () {
	return jwt.sign(
		{
			id: this._id,
		},
		process.env.JWT_SECRET,
		{
			expiresIn: process.env.JWT_EXPIRE || '1h',
		}
	);
};

// Match plain with hash password
UserSchema.methods.checkPassword = async function (plainPassword) {
	return await bcrypt.compare(plainPassword, this.password);
};

module.exports = model('User', UserSchema);
