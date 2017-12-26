'use strict';

const WebSocket = require('ws');
const Util = require('util');
const Moment = require('moment');
const MySQL = require('../utils/mysql-handler');
const Constants = require('../config/constants');
const Message = require('../config/messageTypes');
const Emitters = require('../utils/emitters');
const BoardApp = require('../board/BoardApp');

const mobileMap = new Map();

Emitters.getStateEmitter().on(Message.UPDATE_STATE, (device, state) => {
    console.log("MobileApp_ UPDATE_STATE#1 device: " + device + " state: " + JSON.stringify(state));
    console.log("MobileApp_ UPDATE_STATE#2 mobileMap: " + JSON.stringify(mobileMap));
    for (let mobile in mobileMap.values()) {
        console.log("MobileApp_ UPDATE_STATE#3 mobile: " + JSON.stringify(mobile));
        if (mobile.user.device === device) {
            sendState(mobile.ws, mobile.user.name, state);
        }
    }
});

function sendState(ws, username, state) {
    if (ws.readyState === WebSocket.OPEN) {
        const message = {
            _type: Message.UPDATE_STATE,
            version: 2,
            state: state
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

function orderRelay(ws, device, floor) {
    Emitters.getOrderEmitter().emit(Message.RELAY_ORDER, device, floor, err => {
        if (err) {
            console.log('Error emitting Relay Order: ' + err)
        }
        const message = {
            _type: Message.RELAY_ORDER_RESPONSE,
            version: 2,
            order: {
                floor: floor,
                device: device
            }
        };
        message.success = !err;

        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(message), err => {
                if (err) {
                    // TODO: use push to deliver
                }
            });
        } else {
            // TODO: use push to deliver
        }
    });
}

function sendInfo(ws, type, id) {
    if (type === Constants.fetchTypes.GROUP) {
        MySQL.query('SELECT * from ?? WHERE id = ?;', [Constants.tableNames.GROUP, id])
            .then(results => {
                if (results.length === 1) {
                    let group = results[0];
                    MySQL.query('SELECT * from ?? WHERE group_id = ?;', [Constants.tableNames.BOARD, group.id])
                        .then(results => {
                            let elevators = [];
                            results.forEach(result => {
                                const elevator = {
                                    id: result.id,
                                    device: result.username,
                                    min_floor: result.min_floor,
                                    floor_count: result.floor_count,
                                    address: result.address,
                                    description: result.description,
                                    latitude: result.latitude,
                                    longitude: result.latitude
                                };
                                elevators.push(elevator)
                            });
                            const message = {
                                _type: Message.GROUP_INFO,
                                version: 2,
                                group: {
                                    id: group.id,
                                    description: group.description,
                                    elevators: elevators
                                }
                            };
                            if (ws.readyState === WebSocket.OPEN) {
                                ws.send(JSON.stringify(message), err => {
                                    if (err) {
                                        // TODO: use push to deliver
                                        console.error(Moment().format() + ' Could not deliver Group info: ' + group.id + ' : ' + err);
                                    }
                                });
                            } else {
                                // TODO: use push to deliver
                                console.error(Moment().format() + ' Could not deliver Group info: ' + group.id);
                            }
                        })
                        .catch(err => {
                            console.error(Moment().format() + ' Error fetching Boards for Group: ' + group.id + ' : ' + err);
                        });
                } else {
                    console.warn(Moment().format() + ' Fetching unregistered Group: ' + id);
                }
            })
            .catch(err => {
                console.error(Moment().format() + ' Error fetching Group: ' + err);
            });
    } else {
        console.warn(Moment().format() + ' Unhandled fetch type: ' + type);
    }
}

module.exports = {
    onConnect(user, ws, req) {
        //ws.send('MobileApp, Hello: ' + username);
        mobileMap.set(user.name, {user: user, ws: ws});
        console.info(Moment().format() + ' Total Mobiles connected: ' + mobileMap.size + ' new Mobile: ' + user.name);
        console.log("MobileApp_ onConnect mobileMap: " + JSON.stringify(mobileMap));
    },
    onMessage(user, ws, req, message) {
        switch (message._type) {
            case Message.LISTEN_DEVICE:
                user.device = message.device;
                let state = BoardApp.getState(user.device);
                state.device = message.device;
                sendState(ws, user.name, state);
                console.info(Moment().format() + ' User ' + user.name + ' started to listen ' + user.device);
                break;
            case Message.STOP_LISTENING:
                user.device = undefined;
                console.info(Moment().format() + ' User ' + user.name + ' stopped listening');
                break;
            case Message.RELAY_ORDER:
                orderRelay(ws, message.order.device, message.order.floor);
                break;
            case Message.FETCH_INFO:
                sendInfo(ws, message.fetch.type, message.fetch.id);
                break;
            default:
                console.warn(Moment().format() + ' Unhandled Mobile message: ' + JSON.stringify(message));
                break;
        }
    },
    onClose(user, ws, req) {
        console.log("MobileApp_ onClose1 mobileMap: " + JSON.stringify(mobileMap));
        mobileMap.delete(user.name);
        console.log("MobileApp_ onClose2 mobileMap: " + JSON.stringify(mobileMap));
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
