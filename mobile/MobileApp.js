'use strict';

const Moment = require('moment');
const MySQL = require('../utils/mysql-handler');
const Constants = require('../config/constants');
const Message = require('../config/messageTypes');
const BoardApp = require('../board/BoardApp');

const mobileMap = new Map();

BoardApp.stateEmitter.on(Message.UPDATE_STATE, (device, state) => {
    for (let mobile in mobileMap.values()) {
        if (mobile.user.device === device) {
            if (mobile.ws.readyState === WebSocket.OPEN) {
                mobile.ws.send(state, err => {
                    if (err) {
                        console.info(Moment().format() + ' Cannot update Mobile: ' + mobile.user.name);
                    }
                });
            } else {
                console.warn(Moment().format() + ' Mobile has been disconnected but still in memory: ' + mobile.user.name);
            }
        }
    }
});

module.exports = {
    onConnect(user, ws, req) {
        //ws.send('MobileApp, Hello: ' + username);
        mobileMap.set(user.name, {user: user, ws: ws});
        console.info(Moment().format() + ' Total Mobiles connected: ' + mobileMap.size + ' new Mobile: ' + user.name);
    },
    onMessage(user, ws, req, message) {
        switch (message._type) {
            case Message.LISTEN_DEVICE:
                user.device = message.device;
                let state = BoardApp.getState(user.device);
                ws.send({
                    "_type": "UpdateState",
                    "version": 2,
                    "state": state
                }, err => {
                    if (err) {
                        console.info(Moment().format() + ' Cannot update Mobile: ' + user.name);
                    }
                });
                console.debug(Moment().format() + ' User ' + user.name + ' started to listen ' + user.device);
                break;
            case Message.RELAY_ORDER:
                //TODO: RELAY_ORDER
                break;
            default:
                console.warn(Moment().format() + ' Unhandled Mobile message: ' + JSON.stringify(message));
                break;
        }
    },
    onClose(user, ws, req) {
        mobileMap.delete(user.name);
        console.debug(Moment().format() + ' Total Mobiles connected: ' + mobileMap.size + ' Mobile disconnected: ' + user.name);
    },
    onAuth(user, cb) {
        MySQL.query('INSERT INTO ?? (username, token, ip) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE token=?, ip=?;',
            [Constants.tableNames.MOBILE, user.name, user.pass, user.ip, user.pass, user.ip])
            .then(() => {
                console.info(Moment().format() + ' Auth SUCCESS for User: ' + JSON.stringify(user));
                cb(true);
            })
            .catch(err => {
                console.error(Moment().format() + ' Error inserting User: ' + err);
                cb(false);
            });
    }
};
