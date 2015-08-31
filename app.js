"use strict";

var netatmo = require('netatmo'),
    async = require('async'),
    _ = require('lodash'),
    moment = require('moment-timezone'),
    api = new netatmo({
        'client_id': process.env.CLIENT_ID,
        'client_secret': process.env.CLIENT_SECRET,
        'username': process.env.USERNAME,
        'password': process.env.PASSWORD,
    });

function getMyDevices(deviceIds, devices, modules, callback) {
    var myDevices = _.map(deviceIds, function(id) {
        return {
            device: _.find(devices, function(device) {
                return id = device._id;
            }),
            modules: _.filter(modules, function(module) {
                return id == module.main_device;
            })
        };
    });
    callback(null, myDevices);
}

function toJST(time_utc) {
  return moment(time_utc, 'X').tz("Asia/Tokyo").format();
}

function pluckDevice(device) {
    return {
        module_name: device.module_name,
        time_utc: toJST(device.dashboard_data.time_utc),
        noise: device.dashboard_data.Noise,
        temperature: device.dashboard_data.Temperature,
        humidity: device.dashboard_data.Humidity,
        pressure: device.dashboard_data.Pressure,
        co2: device.dashboard_data.CO2
    };
}

function pluckModule(module) {
    var retval = {
        module_name: module.module_name,
        time_utc: toJST(module.dashboard_data.time_utc),
        temperature: module.dashboard_data.Temperature,
        humidity: module.dashboard_data.Humidity
    };
    // for the additionnal indoor module
    // https://dev.netatmo.com/doc/methods/devicelist
    if (module.type == 'NAModule4'){
        retval[co2] = module.dashboard_data.CO2;
    }
    return retval;
}

function resultsOut(results) {
    _.forEach(results, function(result) {
        console.log(pluckDevice(result.device));
        _.forEach(result.modules, function(module) {
            console.log(pluckModule(module));
        });
    });
}

function measure(callback) {
    async.waterfall([
        function(callback) {
            api.getUser(callback);
        },
        function(user, callback) {
            api.getDevicelist(function(err, devices, modules) {
                if (err) return callback(err);
                getMyDevices(user.devices,
                             devices, modules,
                             callback);
            });
        }], function(err, results) {
            if (err) return console.log(err);
            resultsOut(results);
            console.log('----');
            setTimeout(callback, process.env.INTERVAL);
        });
}

async.forever( measure, function(err) {
    if(err) console.log(err);
});
