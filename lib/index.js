'use strict';

var loopback = require('loopback');
var DataModel = loopback.PersistedModel || loopback.DataModel;

function loadModel(jsonFile) {
    var modelDefinition = require(jsonFile);
    return DataModel.extend(modelDefinition.name,
        modelDefinition.properties,
        {
            relations: modelDefinition.relations,
            foreignKeys: modelDefinition.foreignKeys
        });
}

function loadBaseModel(jsonFile) {
    var modelDefinition = require(jsonFile);
    return BaseModel.extend(modelDefinition.name,
        modelDefinition.properties, {
            plural: modelDefinition.plural
        });
}

var Nfvinspectorbmshssfeplugin = loadBaseModel('./models/nfv-inspector-bms-hss-fe-plugin.json');
// var NodeTypeModel = loadModel('./models/node-type.json');
// var NodeModel = loadModel('./models/node.json');
//
exports.Nfvinspectorbmshssfeplugin = require('./models/nfv-inspector-bms-hss-fe-plugin')(Nfvinspectorbmshssfeplugin);
// exports.Nodetype = require('./models/node-type')(NodeTypeModel);
// exports.Node = require('./models/node')(NodeModel);

module.exports = function (nfvinspector, options) {
    nfvinspector.model(exports.Nfvinspectorbmshssfeplugin);
    // nfvinspector.model(exports.Nodetype, { dataSource: 'mysql' });
    // nfvinspector.model(exports.Node, { dataSource: 'mysql' });
    console.log("Initializing NFV-Inspector-BMS-HSS-FE-Plugin...");
};