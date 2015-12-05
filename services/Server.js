
'use strict';

var knex = require('./../lib/database').knex;

module.exports = {};

/**
 * Search for servers
 * @param opts {object|undefined} Leave empty for all servers
 * @param opts.maintainerid {integer} filter on maintainer
 * @param opts.continent {string} filter on continent
 * @param opts.serverid {integer} server id
 * @return {Promise}
 */
module.exports.servers = function (opts) {
    var q = knex.select('*').from('server');

    if (opts) {
        q = q.where(opts);
    }

    return q;
};

/**
 * Get number of active servers.
 * @return {Promise}
 */
module.exports.activeServers = function () {
    return knex('server').count('serverid as online')
        .where('active', '1')
        .andWhere('status', '>', '0')
        .andWhere('status', '<', '4');
};

/**
 * Get all mirror servers that are not hidden (for display on home).
 * @return {Promise}
 */
module.exports.serversWithMaintainers = function () {
    return knex('server')
        .join('maintainer', 'server.maintainerid', '=', 'maintainer.maintainerid')
        .select('server.*', 'maintainer.displayname', 'maintainer.name', 'maintainer.p_displayname_serverlist')
        .where('hidden', 0)
        .orderBy('server.active', 'desc');
};