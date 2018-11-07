'use strict';

module.exports.migrate = function (app) {
    var mysqlDs = app.dataSources.mysql;

    mysqlDs.autoupdate("node_type", function (err) {
        console.log("\nAutoupdated table 'node_type'");

        mysqlDs.autoupdate("node", function (err) {
            console.log("\nAutoupdated table 'node'");
        });
    });
};