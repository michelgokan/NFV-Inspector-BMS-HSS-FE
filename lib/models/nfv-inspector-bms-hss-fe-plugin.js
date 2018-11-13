'use strict';

module.exports = Nfvinspectorbmshssfeplugin;

function getHSSFEConfigs(Nfvinspectorbmshssfeplugin) {
    var configuration_model = Nfvinspectorbmshssfeplugin.app.models.configuration;

    var configuration = configuration_model.find({
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

    configuration.then(function (hss_information) {

        var hss_configs = {};
        hss_information.forEach(function (configs) {
            hss_configs[configs.key] = configs.value;
        });

        return hss_configs;

    });

    return configuration;
}

function Nfvinspectorbmshssfeplugin(Nfvinspectorbmshssfeplugin) {

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

                        if (regex.test(contents)) {
                            var parsed_string = contents.match(regex);
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

    Nfvinspectorbmshssfeplugin.observe('access', function (ctx, next) {
        console.log(ctx.args);
        console.log("K8s has been called!\n");
        next();
    });

    return Nfvinspectorbmshssfeplugin;
}
