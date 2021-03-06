
'use strict';

var bcrypt = require('bcrypt');
var moment = require('moment');

var Maintainer = require('./../services/Maintainer');

module.exports = {};

module.exports.middleware = require('./authentication/middleware');


var auth = function() {
    this.maintainer = null;
};

/**
 * Is Authenticated
 */
auth.prototype.isAuthenticated = function (req) {
    var self = this;
    return new Promise(function(resolve,reject){
        if (req.session.hasOwnProperty('auth-user') && req.session.hasOwnProperty('auth-time')) {
            // Check if the time is within 1 hour
            if ((moment().unix() - req.session['auth-time']) > 3600) {
                return reject();
            }

            // Check here if the user is still active
            Maintainer.maintainer({maintainerid: req.session['auth-user']})
            .then(function(rows) {
                if (rows.length === 0) {
                    return reject();
                }

                self.maintainer = rows[0];

                // Set auth-time to now
                req.session['auto-time'] = moment().unix();

                // Resolve promose
                return resolve();
            })
            .catch(function(err) {
                return reject();
            });
        }else{reject();}
    });
};

/**
 * Login
 * @param req
 * @param maintainerid {integer}
 * @param rowHash {string}
 * @param givenPassword {string}
 * @return {Promise}
 */
auth.prototype.login = function (req, maintainerid, rowHash, givenPassword) {
    return new Promise(function(resolve, reject) {
        bcrypt.compare(givenPassword, rowHash, function(err, res) {
            if (err || !res) {
                return reject();
            }
            if (res) {
                req.session['auth-user'] = maintainerid;
                req.session['auth-time'] = moment().unix();
                return resolve();
            }
        });
    });
};

/**
 * Logout
 * @param req
 */
auth.prototype.logout = function (req) {
    delete req.session['auth-user'];
    delete req.session['auth-time'];
};

/**
 * Check if password is correct with row password.
 * @param maintainerid
 * @param rowHash
 * @param givenPassword
 * @return {Promise}
 */
auth.prototype.checkPassword = function (maintainerid, rowHash, givenPassword) {
    return new Promise(function (resolve, reject) {
        bcrypt.compare(givenPassword, rowHash, function(err, res) {
            if (err || !res) {
                return reject();
            }
            return resolve();
        });
    });
};

/**
 * Generate new hash
 * @param password {string}
 * @return {Promise}
 */
auth.prototype.makeNewHash = function (password) {
    return new Promise(function (resolve, reject) {
        bcrypt.hash(password, 10, function (err, hash) {
            if (err || !hash) {
                return reject(err);
            }
            return resolve(hash);
        });
    });
};

module.exports.auth = auth;
