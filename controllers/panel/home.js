"use strict";

module.exports = {};

/**
 * GET /panel/secure/
 */
module.exports.getHome = function (req, res) {
    res.render('panel/home');
};