"use strict";

var pool = require('./../lib/database').pool;

var Server = require('./../services/Server');

var bouncer = require('express-bouncer')(750, 900000, 2);
var request = require('request');
var async = require('async');
var moment = require('moment');
var Address4 = require('ip-address').Address4;
var Address6 = require('ip-address').Address6;

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
                isDonated: req.query.hasOwnProperty('thanks'),
                isServerTested: req.query.hasOwnProperty('servertest') ? (req.query.servertest == 1) : null,
                mirrorsOnline: mirrorsOnline,
                mirrors: mirrors
            });
        })
        .catch(function (err) {
            console.error(err);

            res.status(500).send("Can't get mirror list!");
        });
};



module.exports.postServertest = function (req, res, next) {
    // We will test the server ip4/ip6 for correct maniacdn settings.
    // Fire get timestamp.txt on it!
    if (! req.body.hasOwnProperty('serverAddress')) {
        res.redirect('/');
        return;
    }
    var ip = req.body.serverAddress;

    // Detect 4 or 6
    var ip4 = new Address4(ip);
    var ip6 = new Address6(ip);

    // Valid test
    if (! ip4.isValid() && ! ip6.isValid()) {
        res.redirect('/');
        return;
    }

    if (ip6.isValid()) {
        ip = '[' + ip + ']';
    }

    // Do the request!
    let runners = [
        {
            url: "http://" + ip + "/timestamp.txt",
            options: {
                headers: {
                    'Host': 'maniacdn.net',
                    'User-Agent': 'ManiaCDN Bot/1.0.0'
                },
                timeout: 2000
            }
        },
        {
            url: "http://" + ip + "/timestamp.txt",
            options: {
                headers: {
                    'Host': 'www.maniacdn.net',
                    'User-Agent': 'ManiaCDN Bot/1.0.0'
                },
                timeout: 2000
            }
        }
    ];

    async.eachSeries(runners, function(run, callback) {
        request(run.url, run.options, function(err, res, body) {
            if (err || !body) {
                return callback(false);
            }

            let serverStamp = parseInt(body.replace(new RegExp('\n', 'g'), ''));
            let currentStamp = moment().unix();

            if (isNaN(serverStamp) || res.statusCode !== 200) {
                return callback(false);
            }

            let difference = currentStamp - serverStamp;

            if (difference > 86400) {
                // Should be updated, but it isn't. Reject!
                return callback(false);
            }

            return callback(true);
        });
    }, function(result) {
        bouncer.reset(req);
        res.redirect('/?servertest=' + (result ? 1 : 0));
    });
};
