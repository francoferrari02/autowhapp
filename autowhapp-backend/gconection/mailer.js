const nodemailer = require('nodemailer');

// Replace these with your Gmail address and app password
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'autowhapp@gmail.com', // your Gmail
        pass: ''     // 16-char app password (la que jony mando al grupo de whatsapp)
    }
});

function sendMail(destMail, subject, text) {
    const mailOptions = {
        from: 'autowhapp@gmail.com',
        to: destMail,
        subject: subject,
        text: text
    };

    transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
            console.error('Error sending email:', error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
}

module.exports = sendMail;
