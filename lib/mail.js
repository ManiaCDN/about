"use strict";

var config = require('./config');

var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');

// Mail transporter
let transporter = nodemailer.createTransport(smtpTransport({
    port: 25,
    host: 'localhost',
    secure: false,
    ignoreTLS: true
}));

module.exports = {};

/**
 * Send password change notification
 * @param maintainer
 */
module.exports.sendPasswordChanged = function (maintainer) {
    transporter.sendMail({
        from: config.admin.sender,
        to: maintainer.email,
        subject: 'ManiaCDN.net: Password Change notification!',
        text: 'Dear ' + maintainer.name + ',\n\nYour password has been changed! If you didn\'t change your password you need to contact us right now!\nsecurity@maniacdn.net\n\nThank you!\nManiaCDN Team'
    });
};
