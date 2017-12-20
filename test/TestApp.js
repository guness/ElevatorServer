'use strict';

const Moment = require('moment');
const MySQL = require('../utils/mysql-handler');
const Constants = require('../config/constants');

module.exports = {
    onConnect(username, ws, req) {
        //ws.send('TestApp, Hello: ' + username);
    },
    onMessage(user, ws, req, message) {

    },
    onClose(user, ws, req) {

    },
    onAuth(user, cb) {
        console.info(Moment().format() + ' Auth ALLOW for Test: ' + JSON.stringify(user));
        cb(true);
    }
};