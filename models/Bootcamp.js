const { model, Schema } = require('mongoose');
const slugify = require('slugify');
const geocoder = require('../services/nodeGeocoder');

const BootcampSchema = new Schema(
	{
		name: {
			type: String,
			required: [true, 'Please add a name.'],
			unique: true,
			trim: true,
			maxlength: [50, 'Name can not be more than 50 chars.'],
		},
		slug: String,
		description: {
			type: String,
			required: [true, 'Please add a description'],
			maxlength: [500, 'Description can not be more than 500 chars'],
		},
		website: {
			type: String,
			match: [
				/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
				'Please enter a valid website',
			],
		},
		phone: {
			type: String,
			maxlength: [20, 'Phone can not be more than 20 chars.'],
		},
		email: {
			type: String,
			match: [
				/(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/,
				'Phone can not be more than 20 chars.',
			],
		},
		address: String,
		location: {
			type: {
				enum: ['Point'],
				type: String,
			},
			coordinates: {
				index: '2dsphere',
				type: [Number],
			},
			formattedAddress: String,
			street: String,
			city: String,
			state: String,
			zipCode: String,
			country: String,
		},
		careers: {
			type: [String],
			required: true,
			enum: [
				'Web Development',
				'Mobile Development',
				'UI/UX',
				'Data Science',
				'Business',
				'Other',
			],
		},
		averageRating: {
			type: Number,
			min: [1, 'Rating must be at least 1.'],
			max: [10, 'Rating can not be more than 10.'],
		},
		averageCost: Number,
		photo: {
			type: String,
			default: 'no-photo.jpg',
		},
		housing: {
			type: Boolean,
			default: false,
		},
		jobAssistance: {
			type: Boolean,
			default: false,
		},
		jobGuarantee: {
			type: Boolean,
			default: false,
		},
		acceptGi: {
			type: Boolean,
			default: false,
		},
		createdAt: {
			type: Date,
			default: Date.now,
		},
		user: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
	},
	{
		toJSON: {
			virtuals: true,
		},
		toObject: {
			virtuals: true,
		},
	}
);

// Create slug from name.
BootcampSchema.pre('save', function (next) {
	this.slug = slugify(this.name, { lower: true });
	next();
});

// Geocode create location field
BootcampSchema.pre('save', async function (next) {
	const loc = await geocoder.geocode(this.address);
	this.location = {
		type: 'Point',
		coordinates: [loc[0].longitude, loc[0].latitude],
		formattedAddress: loc[0].formattedAddress,
		stree: loc[0].streetName,
		city: loc[0].city,
		state: loc[0].stateCode,
		zipCode: loc[0].zipcode,
		country: loc[0].countryCode,
	};

	// Remove address from db because now we have location field
	this.address = undefined;

	next();
});

// Cascade delete of courses when a bootcamp is deleted
BootcampSchema.pre('remove', async function (next) {
	await this.model('Course').deleteMany({ bootcamp: this._id });

	next();
});

// Reverse populate with virtuals
BootcampSchema.virtual('courses', {
	ref: 'Course',
	localField: '_id',
	foreignField: 'bootcamp',
	justOne: false,
});

module.exports = model('Bootcamp', BootcampSchema);
