'use strict';

const WebSocket = require('ws');
const Util = require('util');
const Moment = require('moment');
const MySQL = require('../utils/mysql-handler');
const Constants = require('../config/constants');
const Message = require('../config/messageTypes');
const BoardApp = require('../board/BoardApp');

const mobileMap = new Map();

BoardApp.stateEmitter.on(Message.UPDATE_STATE, (device, state) => {
    for (let mobile in mobileMap.values()) {
        if (mobile.user.device === device) {
            sendState(mobile.user.name, mobile.ws, state);
        }
    }
});

function sendState(username, ws, state) {
    if (ws.readyState === WebSocket.OPEN) {
        const message = {
            "_type": Message.UPDATE_STATE,
            "version": 2,
            "state": state
        };
        ws.send(JSON.stringify(message), err => {
            if (err) {
                console.warn(Moment().format() + ' Cannot update Mobile: ' + username + ' err: ' + err);
            }
        });
    } else {
        console.warn(Moment().format() + ' Cannot update Mobile: ' + username + ' since socket is not OPEN');
    }
}

function orderRelay(device, floor, cb) {
    //TODO: implement here
}

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
                sendState(user.name, ws, state);
                console.info(Moment().format() + ' User ' + user.name + ' started to listen ' + user.device);
                break;
            case Message.RELAY_ORDER:
                //TODO: implement here
                orderRelay(user.device, message.floor, err => {
                    const message = {
                        _type: Message.RELAY_ORDER_RESPONSE,
                        floor: message.floor
                    };
                    if (err) {
                        message.success = false;
                        ws.send(JSON.stringify(message), err => {

                        });
                    } else {
                        message.success = true;
                        ws.send(JSON.stringify(message), err => {
                            // TODO: use push to deliver
                        });
                    }
                });
                break;
            default:
                console.warn(Moment().format() + ' Unhandled Mobile message: ' + JSON.stringify(message));
                break;
        }
    },
    onClose(user, ws, req) {
        mobileMap.delete(user.name);
        console.info(Moment().format() + ' Total Mobiles connected: ' + mobileMap.size + ' Mobile disconnected: ' + user.name);
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
