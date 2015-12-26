
'use strict';

var express = require('express');
var router = express.Router();
var bouncer = require('express-bouncer')(750, 900000, 2);

var homeController = require('./../controllers/home');

/**
 * Bouncer action
 */
bouncer.blocked = function (req, res) {
    res.status(403).send("Too many requests have been made!");
};

/**
 *  Get about home page
 */
router.get('/', homeController.getHome);
router.post('/servertest', bouncer.block, homeController.postServertest);

module.exports = router;
