"use strict";

var netatmo = require('netatmo'),
    async = require('async'),
    _ = require('lodash'),
    flatMap = _.compose(_.flatten, _.map),
    moment = require('moment-timezone'),
    api = new netatmo({
        'client_id': process.env.CLIENT_ID,
        'client_secret': process.env.CLIENT_SECRET,
        'username': process.env.USERNAME,
        'password': process.env.PASSWORD,
    });

function getUser(callback) {
    api.getUser(function(err, user) {
        if (err) return callback(err);
        callback(null, user.devices);
    });
}

function getMyDevices(deviceIds, devices, callback) {
    var selectDevices = flatMap(deviceIds, function(id) {
        return flatMap(devices, function(device) {
            if (id == device._id) return [device];
            else return [];
        });
    });
    if (_.isEmpty(selectDevices)) return callback(new Error('my devices are not found'));
    callback(null, selectDevices);
}

function getMyModules(deviceIds, modules, callback) {
    var selectModules = flatMap(deviceIds, function(id) {
        return flatMap(modules, function(module) {
            if (id == module.main_device) return [module];
            else return [];
        });
    });
    if (_.isEmpty(selectModules)) return callback(new Error('my modules are not found'));
    callback(null, selectModules);
}


function getDevices(deviceIds, callback) {
    api.getDevicelist(function(err, devices, modules) {
        if (err) return callback(err);
        async.series([
            _.partial(getMyDevices, deviceIds, devices),
            _.partial(getMyModules, deviceIds, modules)
        ],function(err, results) {
            if(err) return callback(err);
            else callback(null, results);
        });
    });
}


function toJST(time_utc) {
  return moment(time_utc, 'X').tz("Asia/Tokyo").format()
}

function measure(callback) {
    async.waterfall([
        getUser,
        getDevices
    ], function(err, results) {
        if(err) return callback(err);

        var devices = results[0],
            modules = results[1];

        _.forEach(devices, function(device) {
            console.log({
                module_name: device.module_name,
                time_utc: toJST(device.dashboard_data.time_utc),
                noise: device.dashboard_data.Noise,
                temperature: device.dashboard_data.Temperature,
                humidity: device.dashboard_data.Humidity,
                pressure: device.dashboard_data.Pressure,
                co2: device.dashboard_data.CO2
            });
        });

        _.forEach(modules, function(module) {
            console.log({
                module_name: module.module_name,
                time_utc: toJST(module.dashboard_data.time_utc),
                temperature: module.dashboard_data.Temperature,
                humidity: module.dashboard_data.Humidity
            });
        });

        setTimeout(callback, 10000);
    });
}

async.forever(measure,function(err) {
    if (err) console.log(err);
});