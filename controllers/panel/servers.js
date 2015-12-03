"use strict";

// Model service objects
var knex = require('./../../lib/database').knex;
var Servers = require('./../../services/Server');


module.exports = {};

/**
 * GET /panel/secure/servers
 */
module.exports.getServers = function (req, res) {
    // Get servers for maintainer
    Servers.servers({
        maintainerid: req.auth.maintainer.maintainerid
    }).then(function(rows) {
        res.render('panel/servers', {servers: rows});
    }).catch(function() {
        // None found! Show empty list
        res.render('panel/servers', {servers: []});
    });
};

/**
 * GET /panel/secure/servers/:serverid
 */
module.exports.getServerEdit = function (req, res) {
    let serverid = req.params.serverid;

    Servers.servers({
        maintainerid: req.auth.maintainer.maintainerid,
        serverid: serverid
    }).then(function(rows) {
        if (rows.length == 0) {
            return res.redirect('/panel/secure/servers');
        }
        res.render('panel/serveredit', {server: rows[0], csrfToken: req.csrfToken()});
    }).catch(function() {
        res.redirect('/panel/secure/servers');
    });
};

/**
 * POST /panel/secure/servers/:serverid
 */
module.exports.postServerEdit = function (req, res) {
    let serverid = req.params.serverid;

    Servers.servers({
        maintainerid: req.auth.maintainer.maintainerid,
        serverid: serverid
    }).then(function(rows) {
        if (rows.length == 0) {
            return res.redirect('/panel/secure/servers');
        }

        var newActive = rows[0].active;

        // Lets check for changes
        if (req.body.edit_active && req.body.edit_active === '1') {
            // Enable server
            newActive = 1;
        }else{
            // Disable server
            newActive = 0;
        }

        // Update
        knex('server').where({
            maintainerid: req.auth.maintainer.maintainerid,
            serverid: serverid
        }).update({
            active: newActive
        }).catch(function(err) {
            res.redirect('/panel/secure/servers?error');
        }).done(function() {
            res.redirect('/panel/secure/servers?done');
        });
    }).catch(function() {
        res.redirect('/panel/secure/servers');
    });
};