'use strict';

module.exports = Nfvinspectorbmshssfeplugin;

function getHSSFEConfigs(Nfvinspectorbmshssfeplugin) {
    var configuration_model = Nfvinspectorbmshssfeplugin.app.models.configuration;

    var configurations = configuration_model.find({
        where: {
            'or':
                [{
                    'and': [{'key': {like: 'hss_%'}},
                        {'category': {like: 'nfv-inspector-bms-hss-fe-plugin'}}]
                },
                    {'key': {like: 'nfv_vms_'}}]
        },
        fields: {"key": true, "value": true}
    });

    var configs = configurations.then(function (hss_information) {

        var hss_configs = {};
        hss_information.forEach(function (configs) {
            hss_configs[configs.key] = configs.value;
        });

        return hss_configs;

    });

    return configs;
}

function Nfvinspectorbmshssfeplugin(Nfvinspectorbmshssfeplugin) {
    var request = require('request');
    var moment = require('moment-timezone');

    Nfvinspectorbmshssfeplugin.startBenchmark = async function (name, rate, duration) {
        var configs = getHSSFEConfigs(Nfvinspectorbmshssfeplugin);

        var result = configs.then(function (hss_configs) {
            //TODO: Make sure if benchmark name with specified rate exists, if not create and load it!
            var request_uri = "http://" + hss_configs['nfv_vms_address'] + ":" + hss_configs['nfv_vms_port']
                + "/api/k8s/callAPI?path=/system/" + name + "-" + rate + "-" + duration + "/run&nodePort=" + hss_configs['hss_mme0_port'];

            var request_result = new Promise(function (resolve, reject) {
                request(request_uri, function (error, response, body) {
                    if (error === null && response.statusCode == 200) {
                        console.log(body);
                        resolve(body);
                    } else {
                        console.error("Error: " + error);
                        var err = new Error("ERROR");
                        err.statusCode = err.status = (error ? 404 : response.statusCode);
                        err.code = 'API_CALL_ERROR';
                        resolve(Promise.reject());
                    }
                });
            });

            return request_result;
        });

        return result;
    };

    Nfvinspectorbmshssfeplugin.checkBenchmarkProgress = async function (name, rate, duration) {
        var configs = getHSSFEConfigs(Nfvinspectorbmshssfeplugin);

        var result = configs.then(function (hss_configs) {
            //TODO: Make sure if benchmark name with specified rate exists, if not create and load it!
            var request_uri = "http://" + hss_configs['nfv_vms_address'] + ":" + hss_configs['nfv_vms_port']
                + "/api/k8s/callAPI?path=/system/" + name + "-" + rate + "-" + duration + "/status&nodePort=" + hss_configs['hss_mme0_port'];

            var request_result = new Promise(function (resolve, reject) {
                request(request_uri, function (error, response, body) {
                    if (error === null && response.statusCode == 200) {
                        console.log(body);

                        var regex = /Progress:\s*([0-9\.]*)%/;

                        if (regex.test(body)) {
                            var parsed_string = body.match(regex);
                            var progress = parsed_string[1];

                            console.log(progress);

                            resolve(progress);
                            return;
                        } else {
                            error = "Can't retrieve benchmark progress";
                        }
                    }

                    console.error("Error: " + error);

                    var err = new Error("ERROR");
                    err.statusCode = err.status = (error ? 404 : response.statusCode);
                    err.code = 'API_CALL_ERROR';
                    resolve(Promise.reject());

                });
            });

            return request_result;
        });

        return result;
    };

    Nfvinspectorbmshssfeplugin.getBenchmarkResults = async function (name, rate, duration, start_time, end_time) {
        var configs = getHSSFEConfigs(Nfvinspectorbmshssfeplugin);
        var test_scenario_name = name + "-" + rate + "-" + duration;

        var result = configs.then(function (hss_configs) {
            //TODO: Make sure if benchmark name with specified rate exists, if not create and load it!
            var request_uri = "http://" + hss_configs['nfv_vms_address'] + ":" + hss_configs['nfv_vms_port']
                + "/api/k8s/executeCommand?command=logs -l app=hssstg-gtc-mme0 -n hssstg";

            var request_result = new Promise(function (resolve, reject) {
                    request(request_uri, function (error, response, body) {
                        try {
                            if (error === null && response.statusCode == 200) {
                                console.log(body);
                                var response_lines = JSON.parse(body).result.split(/\n/);

                                var regex = new RegExp("\\[STAMP\\]\\s*[\\w:]*\\s(\\d*\\/\\d*\\/\\d*\\s\\d*:\\d*:[\\d\\.]*)\\s("+test_scenario_name+")\\sMPS:\\s*(\\d*)\\s*Lat:\\s*([\\d\\.]*)\\s*.*");

                                var latency_data = new Array();

                                response_lines.forEach(function (line) {
                                    if (regex.test(line)) {
                                        var chunks = line.match(regex);
                                        var log_entity_time = moment.tz(chunks[1], hss_configs['hss_timezone']);
                                        var start_time_object = moment(start_time);
                                        var end_time_object = moment(end_time);

                                        if(log_entity_time.isBetween(start_time_object,end_time_object)) {
                                            latency_data.push({
                                                name: chunks[2],
                                                date_in_utc: log_entity_time.utc().format(),
                                                throughput: chunks[3],
                                                latency: chunks[4]
                                            });
                                        }
                                    }
                                });

                                resolve(JSON.parse(JSON.stringify(latency_data)));
                            } else {
                                error = "Can't retrieve benchmark logs";
                            }
                        } catch (e) {
                            error = "Can't parse benchmark progress";
                        }

                        console.error("Error: " + error);

                        var err = new Error("ERROR");
                        err.statusCode = err.status = (error ? 404 : response.statusCode);
                        err.code = 'API_CALL_ERROR';
                        resolve(Promise.reject());

                    });
                }
            );

            return request_result;
        });

        return result;
    };

    Nfvinspectorbmshssfeplugin.remoteMethod('startBenchmark', {
        accepts: [{"arg": "name", "type": "string"},
            {"arg": "rate", "type": "number"},
            {"arg": "duration", "type": "number"}],
        returns: {arg: 'result', type: 'string'},
        http: {path: '/startBenchmark', verb: 'get'}
    });

    Nfvinspectorbmshssfeplugin.remoteMethod('checkBenchmarkProgress', {
        accepts: [{"arg": "name", "type": "string"},
            {"arg": "rate", "type": "number"},
            {"arg": "duration", "type": "number"}],
        returns: {arg: 'result', type: 'string'},
        http: {path: '/checkBenchmarkProgress', verb: 'get'}
    });

    Nfvinspectorbmshssfeplugin.remoteMethod('getBenchmarkResults', {
        accepts: [{"arg": "name", "type": "string"},
            {"arg": "rate", "type": "number"},
            {"arg": "duration", "type": "number"},
            {"arg": "start_time", "type": "DateString"},
            {"arg": "end_time", "type": "DateString"}],
        returns: {arg: 'result', type: 'json'},
        http: {path: '/getBenchmarkResults', verb: 'get'}
    });

    Nfvinspectorbmshssfeplugin.observe('access', function (ctx, next) {
        console.log(ctx.args);
        console.log("K8s has been called!\n");
        next();
    });

    return Nfvinspectorbmshssfeplugin;
}
