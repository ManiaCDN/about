"use strict";

var pool = require('./../lib/database').pool;

var Server = require('./../services/Server');

module.exports = {};

module.exports.getHome = function (req, res, next) {
    // Count and server list
    var mirrorsOnline = 0;
    var mirrors = [];

    // First get queries done
    Server.activeServers()
        .then(function(rows) {
            if (rows.length > 0) {
                mirrorsOnline = rows[0].online;
            }

            // Do next query
            return Server.serversWithMaintainers();
        }).then(function(rows) {
            mirrors = rows;

            // render
            res.render('home', {
                mirrorsOnline: mirrorsOnline,
                mirrors: mirrors
            });
        })
        .catch(function (err) {
            console.error(err);

            res.status(500).send("Can't get mirror list!");
        });
};
