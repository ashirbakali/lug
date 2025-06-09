const nodemailer = require('nodemailer');
const ejs = require('ejs');

const { logger } = require('../utils/logger');

const transport = nodemailer.createTransport({
    host: process.env.HOST,
    service: process.env.SERVICE,
    port: Number(process.env.EMAIL_PORT),
    secure: Boolean(process.env.SECURE),
    auth: {
        user: "luginc.net@gmail.com",
        pass: "Zain@1234"
    },
});

exports.SendEmail = (receiver, subject, content, destination) => {
    try {
        ejs.renderFile(destination, { receiver, content }, (err, data) => {
            if (err) {
                console.log(err.message);
            } else {
                var mailOptions = {
                    from: `Lug Traveler ${"luginc.net@gmail.com"}`,
                    to: receiver,
                    subject: subject,
                    html: data
                };

                transport.sendMail(mailOptions, (error, info) => {
                    if (error) return console.log(error.message);

                    console.log('Message sent: %s', info.messageId);
                });
            }
        });
    } catch (error) {
        logger.error(error.message);
        return error.message;
    }
}