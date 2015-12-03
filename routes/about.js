
'use strict';

var express = require('express');
var router = express.Router();

var homeController = require('./../controllers/home');

/**
 *  Get about home page
 */
router.get('/', homeController.getHome);

module.exports = router;
