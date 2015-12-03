"use strict";

var bouncer = require('express-bouncer')(750, 900000, 2);

module.exports = {};

/**
 * GET /panel/login
 */
module.exports.getLogin = function (req, res) {
    // Check if already logged in
    req.auth.isAuthenticated(req)
        .then(function() {
            res.redirect('/panel/');
        })
        .catch(function() {
            res.render('panel/login', {
                csrfToken: req.csrfToken()
            });
        });
};

/**
 * POST /panel/login
 */
module.exports.postLogin = function (req, res) {
    if (!req.body.hasOwnProperty('login_username') || !req.body.hasOwnProperty('login_password')) {
        res.redirect('/panel/login?error');
        return;
    }

    let user = req.body.login_username;
    let pass = req.body.login_password;

    // Lookup the user
    require('./../../services/Maintainer').maintainer({email: user})
        .then(function(rows) {
            if (rows.length === 0) {
                res.redirect('/panel/login?error');
                return;
            }

            let row = rows[0];

            req.auth.login(req, row.maintainerid, row.password, pass)
                .then(function() {
                    bouncer.reset(req);
                    res.redirect('/panel/secure/');
                })
                .catch(function() {
                    res.redirect('/panel/login?error');
                });
        })
        .catch(function(err) {
            res.redirect('/panel/login?error');
        });
};


/**
 * GET /panel/secure/logout
 */
module.exports.getLogout = function (req, res) {
    req.auth.logout(req);
    res.redirect('/panel/login');
};