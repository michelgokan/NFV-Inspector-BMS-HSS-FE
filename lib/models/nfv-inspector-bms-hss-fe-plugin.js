'use strict';

module.exports = Nfvinspectorbmshssfeplugin;

function Nfvinspectorbmshssfeplugin(Nfvinspectorbmshssfeplugin) {

    Nfvinspectorbmshssfeplugin.startBenchmark = async function (command) {
        function promiseFromChildProcess(child) {
            return new Promise(function (resolve, reject) {
                child.addListener("error", reject);
                child.addListener("exit", resolve);
            });
        }

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

        }).then(function (hss_configs) {
            var request_uri = "http://" + hss_configs['nfv_vms_address'] + ":" + hss_configs['nfv_vms_port']
                                + "/api/k8s/callAPI?path=/system/ST-ESM-25S-2500/status&nodePort="+hss_configs['hss_mme0_port'];
            var request_result = new Promise(function (resolve, reject) {
                request(request_uri, function (error, response, body) {
                    if (error === null && response.statusCode == 200) {
                        console.log(body);
                        resolve(body);
                    } else {
                        console.error("Error: " + error);
                        var err = new Error("ERROR");
                        err.statusCode = err.status = (error === null ? 404 : error.statusCode);
                        err.code = 'API_CALL_ERROR';
                        resolve(Promise.reject());
                    }
                });
            });

            return request_result;
        });

        return result;
    };

    Nfvinspectorbmshssfeplugin.remoteMethod('startBenchmark', {
        //accepts: [{arg: 'command', type: 'string'}],
        accepts: [{"arg": "rate", "type": "number"}],
        returns: {arg: 'result', type: 'string'},
        http: {path: '/startBenchmark', verb: 'get'}
    });

    Nfvinspectorbmshssfeplugin.observe('access', function (ctx, next) {
        console.log(ctx.args);
        console.log("K8s has been called!\n");
        next();
    });

    return Nfvinspectorbmshssfeplugin;
}
