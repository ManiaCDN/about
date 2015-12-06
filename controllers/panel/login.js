"use strict";

var bouncer = require('express-bouncer')(750, 900000, 2);

var Maintainer = require('./../../services/Maintainer');

var moment = require('moment');
var mail = require('./../../lib/mail');

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
                csrfToken: req.csrfToken(),
                isSuccess: req.query.hasOwnProperty('success')
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


/**
 * GET /panel/reset/:token
 */
module.exports.getResetPage = function (req, res) {
    // Error check
    var error = false;
    error = error || !req.params.hasOwnProperty('token');
    if (error) {
        res.redirect('/');
        return;
    }

    // Get maintainer by token.
    Maintainer.maintainer({tokenkey: req.params.token})
        .then(function (rows) {
            // Rows should contain 1 row only!
            if (rows.length === 1) {
                // Ok!
                let maintainer = rows[0];

                // Let's check for the token expire date
                let expire = moment(maintainer.tokenexpire);

                // Is expired?
                if (moment().isAfter(expire)) {
                    // Expired! Delete token from db! Don't wait for it, no need.
                    Maintainer.update(maintainer.maintainerid, {tokenkey: null, tokenexpire: null});
                    res.redirect('/');
                    return;
                }

                // Render password change page
                res.render('panel/reset', {
                    csrfToken: req.csrfToken(),
                    token: req.query.token,
                    isSuccess: req.query.hasOwnProperty('success'),
                    isError: req.query.hasOwnProperty('error')
                });
            }else{
                res.redirect('/');
            }
        })
        .catch(function (err) {
            console.error(err);
            res.redirect('/');
        });
};

module.exports.postResetPage = function (req, res) {
    // Error check
    var error = false;

    error = error || !req.params.hasOwnProperty('token');

    error = error || !req.body.hasOwnProperty('password_1');
    error = error || !req.body.hasOwnProperty('password_2');

    // Error with required fields!
    if (error) {
        res.redirect('/');
        return;
    }

    // Check if passwords are right
    error = error || !(req.body.password_1 === req.body.password_2);
    // Check complexity of password
    error = error || req.body.password_1.length < 8;

    if (error) {
        res.redirect('/panel/reset/' + req.params.token + '?error');
        return;
    }

    Maintainer.maintainer({tokenkey: req.params.token})
    .then(function (rows) {
        if (rows.length !== 1) {
            res.redirect('/');
            return
        }

        let maintainer = rows[0];

        // Generate bcrypt password
        req.auth.makeNewHash(req.body.password_1)
            .then(function (hash) {
                // Make update object
                let update = {
                    tokenkey: null,
                    tokenexpire: null,
                    password: hash
                };

                // Update Maintainer
                Maintainer.update(maintainer.maintainerid, update)
                    .then(function () {
                        // Send mail
                        mail.sendPasswordChanged(maintainer);

                        // Reset bouncer
                        bouncer.reset(req);

                        // Redirect
                        res.redirect('/panel/login?success');
                    })
                    .catch(function(err){
                        console.error(err);
                        res.redirect('/');
                    });
            })
            .catch(function (err) {
                console.error(err);
                res.status(500).send('Server Error!');
            });
    })
    .catch(function() {
        res.redirect('/');
    });
};
