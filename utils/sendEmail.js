const nodemailer = require('nodemailer');

const sendEmail = async ({ subject, text, to }) => {
	const transporter = nodemailer.createTransport({
		auth: {
			user: process.env.SMTP_EMAIL,
			pass: process.env.SMTP_PASSWORD,
		},
		host: process.env.SMTP_HOTST,
		port: process.env.SMTP_PORT,
		secure: false, // true for 465, false for other ports
	});

	const message = {
		from: `"${process.env.FROM_NAME}"<${process.env.FROM_EMAIL}>`,
		subject,
		text,
		to,
	};

	const info = await transporter.sendMail(message);

	console.log('Message sent to: ', info.messageId);
};

module.exports = sendEmail;
