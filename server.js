const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const helmet = require('helmet');
const hpp = require('hpp');
const mongoSanitize = require('express-mongo-sanitize');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');
const xss = require('xss-clean');

const connectDb = require('./config/db');

require('dotenv').config({ path: './config/config.env' });

const errorHandler = require('./middleware/error');

const app = express();
app.use(express.json());

if (process.env.NODE_ENV === 'development') {
	app.use(morgan('dev'));
}

// File Upload middleware
app.use(fileUpload());

// To get acces to req.cookie
app.use(cookieParser());

// Security middlewares
app.use(cors());
app.use(helmet()); // Headers security
app.use(hpp());
app.use(mongoSanitize()); // Prevent user: {"gt": ""}
app.use(xss()); // Prevents xss attack (insert <srcipt></srcipt>) when creating data
const limiter = rateLimit({
	windowMs: 10 * 60 * 1000, // 10 minutes
	max: 100,
});
app.use(limiter);

// Static folder
app.use(express.static(path.join(__dirname, 'public')));

// Connect to mongo
connectDb();

// Mount routes
app.use('/api/v1/auth', require('./routes/auth'));
app.use('/api/v1/bootcamps', require('./routes/bootcamps'));
app.use('/api/v1/courses', require('./routes/courses'));

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 4000;

const server = app.listen(PORT, () => {
	console.log(`App running on port: ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
	console.log(`Error: ${err.message}`);
	server.close(() => {
		process.exit(1);
	});
});
