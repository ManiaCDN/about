"use strict";

var Maintainer = require('./../../services/Maintainer');
var mail = require('./../../lib/mail');

module.exports = {};

/**
 * GET /panel/secure/profile
 */
module.exports.getProfile = function (req, res) {
    res.render('panel/profile/profile', {
        maintainer: req.auth.maintainer,
        isSuccess: req.query.hasOwnProperty('success'),
        isError: req.query.hasOwnProperty('error'),

        csrfToken: req.csrfToken()
    });
};

/**
 * POST /panel/secure/profile
 */
module.exports.postProfile = function (req, res) {
    // Validate all fields.
    var error = false;

    error = error || !req.body.hasOwnProperty('displayname');
    error = error || !req.body.hasOwnProperty('name');
    error = error || !req.body.hasOwnProperty('email');
    error = error || !req.body.hasOwnProperty('password_current');
    error = error || !req.body.hasOwnProperty('password_new_1');
    error = error || !req.body.hasOwnProperty('password_new_2');

    if (error) {
        res.redirect('/panel/secure/profile?error');
        return;
    }

    // Map extras
    let willChangePassword = (req.body.hasOwnProperty('password_change')
        && req.body.password_change === '1') || 0;
    let privacyShowDisplaynameServers = (req.body.hasOwnProperty('p_displayname_serverlist')
        && req.body.p_displayname_serverlist === '1') || 0;
    let privacyShowDisplaynameContribute = (req.body.hasOwnProperty('p_displayname_contributelist')
        && req.body.p_displayname_contributelist === '1') || 0;

    // Check for password extra's. Only when changing.
    error = error || willChangePassword && !req.body.hasOwnProperty('password_current');
    error = error || willChangePassword && !req.body.hasOwnProperty('password_new_1');
    error = error || willChangePassword && !req.body.hasOwnProperty('password_new_2');

    // If error, then stop already and redirect.
    if (error) {
        res.redirect('/panel/secure/profile?error');
        return;
    }

    // Check if passwords are right
    error = error || willChangePassword && !(req.body.password_new_1 === req.body.password_new_2);
    // Check complexity of password
    error = error || willChangePassword && req.body.password_new_1.length < 8;

    // If error, then stop already and redirect.
    if (error) {
        res.redirect('/panel/secure/profile?error');
        return;
    }

    // Prepare update object
    var update = {
        displayname: req.body.displayname,
        name: req.body.name,
        email: req.body.email,
        p_displayname_serverlist: privacyShowDisplaynameServers ? 1 : 0,
        p_displayname_contributelist: privacyShowDisplaynameContribute ? 1 : 0
    };

    // Password checks and new bcrypt (only when request password change!)
    if (willChangePassword) {
        req.auth.checkPassword(req.auth.maintainer.maintainerid, req.auth.maintainer.password, req.body.password_current)
            .then(function () {
                // Make new password
                return req.auth.makeNewHash(req.body.password_new_1);
            })
            .then(function(hash) {
                update.password = hash;

                // Email
                Maintainer.maintainer({maintainerid: req.auth.maintainer.maintainerid})
                .then(function(rows) {
                    if (rows.length > 0) {
                        mail.sendPasswordChanged(rows[0]);
                    }
                });

                // Lets save
                endWithUpdate(req.auth.maintainer.maintainerid, update);
            })
            .catch(function (err) {
                res.redirect('/panel/secure/profile?error');
            });
    } else {
        // Save
        endWithUpdate(req.auth.maintainer.maintainerid, update);
    }

    // Update on final
    function endWithUpdate(id, update) {
        Maintainer.update(id, update)
            .then(function() {
                res.redirect('/panel/secure/profile?success');
            })
            .catch(function() {
                res.redirect('/panel/secure/profile?error');
            });
    }
};