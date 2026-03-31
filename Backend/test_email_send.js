require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

transporter.sendMail({
    from: `"CleanStreet" <${process.env.EMAIL_USER}>`,
    to: 'sanikadali70@gmail.com',
    subject: 'CleanStreet - OTP Test',
    html: '<h2>Your OTP is: <b>482931</b></h2><p>This is a test to confirm OTP delivery is working.</p>',
}, (err, info) => {
    if (err) {
        console.log('FAILED:', err.message);
    } else {
        console.log('SUCCESS! Email sent. MessageId:', info.messageId);
    }
});
