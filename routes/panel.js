
'use strict';

var express = require('express');
var router = express.Router();

var csrf = require('csurf');
var csrfProtection = csrf({cookie: false});
var bouncer = require('express-bouncer')(750, 900000, 2);
var moment = require('moment');

// Controllers
var loginController = require('./../controllers/panel/login');
var panelHomeController = require('./../controllers/panel/home');
var panelServersController = require('./../controllers/panel/servers');
var panelProfileController = require('./../controllers/panel/profile');

// Authentication/Authorization
var auth = require('./../lib/authentication');
var authRequired = auth.middleware.requireAuthenticated;
var authInit = auth.middleware.initAuthenticated;

/**
 * Bouncer action
 */
bouncer.blocked = function (req, res) {
    res.send (403, "Too many requests have been made!");
};

/**
 * /Secure/* will need an active login
 */
router.use('/secure/*', authRequired);

/**
 * Login page (GET)
 */
router.get('/login', csrfProtection, authInit, loginController.getLogin);

/**
 * Logout action
 */
router.get('/secure/logout', authInit, loginController.getLogout);

/**
 * Login action (POST)
 */
router.post('/login', bouncer.block, csrfProtection, authInit, loginController.postLogin);

/**
 * Panel Home
 */
router.get('/secure/', panelHomeController.getHome);

/**
 * Server List
 */
router.get('/secure/servers', panelServersController.getServers);

/**
 * Server Edit
 */
router.get('/secure/servers/:serverid', csrfProtection, panelServersController.getServerEdit);

/**
 * Server Edit Post
 */
router.post('/secure/servers/:serverid', csrfProtection, panelServersController.postServerEdit);


router.get('/secure/profile', csrfProtection, panelProfileController.getProfile);
router.post('/secure/profile', csrfProtection, panelProfileController.postProfile);


/**
 *  Redirect to panel home. Will automatically ask for login when not being in an active session.
 */
router.get('/', function (req, res, next) {
    res.redirect('/panel/secure/');
    res.end();
});

module.exports = router;
