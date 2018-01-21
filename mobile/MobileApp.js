'use strict';

const WebSocket = require('ws');
const Util = require('util');
const Moment = require('moment');
const MySQL = require('../utils/mysql-handler');
const Firebase = require('../utils/firebase-handler');
const Constants = require('../config/constants');
const Message = require('../config/messageTypes');
const Emitters = require('../utils/emitters');
const SavedOrder = require('../models/SavedOrder');
const BoardApp = require('../board/BoardApp');

const mobileMap = new Map();
const savedOrders = new Map();

Emitters.getStateEmitter().on(Message.UPDATE_STATE, (device, state) => {
    let deviceOrders = getSavedDeviceOrders(device);
    mobileMap.forEach(mobile => {
        let mobileUserName = mobile.user.name;
        if (mobile.user.device === device) {
            sendState(mobile.ws, mobileUserName, state);
            if (state.action === "STOP") {
                let savedOrder = deviceOrders.get(mobileUserName);
                if (savedOrder) {
                    if (savedOrder.floor === state.floor) {
                        // No need to keep deviceOrder, it is fulfilled and mobile is alert.
                        deviceOrders.delete(mobileUserName);
                    }
                }
            }
        }
    });
    if (state.action === "STOP") {
        deviceOrders.forEach(savedOrder => {
            if (savedOrder.floor === state.floor) {
                // No need to keep deviceOrder, it is fulfilled and mobile is alert.
                const message = {
                    _type: Message.UPDATE_STATE,
                    version: 2,
                    state: state
                };
                sendPush(savedOrder.user, message);
                deviceOrders.delete(savedOrder.user);
            }
        });
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
            console.warn(Moment().format() + ' Error emitting Relay Order: ' + err)
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

function sendGroupInfo(ws, group) {
    MySQL.query('SELECT * FROM ?? WHERE group_id = ?;', [Constants.tableNames.BOARD, group.id])
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
                    longitude: result.longitude
                };
                elevators.push(elevator)
            });
            const message = {
                _type: Message.GROUP_INFO,
                version: 2,
                group: {
                    id: group.id,
                    uuid: group.uuid,
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
}

function sendInfo(ws, fetch) {
    if (fetch.type === Constants.fetchTypes.GROUP) {
        MySQL.query('SELECT * FROM ?? WHERE id = ?;', [Constants.tableNames.GROUP, fetch.id])
            .then(results => {
                if (results.length === 1) {
                    let group = results[0];
                    sendGroupInfo(ws, group);
                } else {
                    console.warn(Moment().format() + ' Fetching unregistered Group: ' + fetch.id);
                }
            })
            .catch(err => {
                console.error(Moment().format() + ' Error fetching Group: ' + err);
            });
    } else if (fetch.type === Constants.fetchTypes.UUID) {
        //TODO: fetch on other things as well
        MySQL.query('SELECT * FROM ?? WHERE uuid = ?;', [Constants.tableNames.GROUP, fetch.uuid])
            .then(results => {
                if (results.length === 1) {
                    let group = results[0];
                    sendGroupInfo(ws, group);
                } else {
                    console.warn(Moment().format() + ' Fetching unregistered UUID: ' + fetch.id);
                }
            })
            .catch(err => {
                console.error(Moment().format() + ' Error fetching Group: ' + err);
            });
    } else {
        console.warn(Moment().format() + ' Unhandled fetch type: ' + type);
    }
}

function sendPush(username, message) {
    MySQL.query('SELECT token FROM ?? WHERE username = ?;', [Constants.tableNames.MOBILE, username])
        .then(results => {
            if (results.length === 1) {
                let mobile = results[0];
                console.log("token for " + username + " is: " + mobile.token);
                let payload = {
                    data: {
                        protocol: JSON.stringify(message)
                    }
                };

                Firebase.sendMessage(mobile.token, payload)
            } else {
                console.warn(Moment().format() + ' Fetching unregistered Mobile: ' + username);
            }
        })
        .catch(err => {
            console.error(Moment().format() + ' Error fetching Mobile: ' + err);
        });
}

function getSavedDeviceOrders(device) {
    let deviceOrders = savedOrders.get(device);
    if (!deviceOrders) {
        deviceOrders = new Map();
        savedOrders.set(device, deviceOrders);
    }
    return deviceOrders;
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
                sendState(ws, user.name, state);
                console.info(Moment().format() + ' User ' + user.name + ' started to listen ' + user.device);
                break;
            case Message.STOP_LISTENING:
                if (message.device === user.device || !message.device) {
                    user.device = undefined;
                }
                console.info(Moment().format() + ' User ' + user.name + ' stopped listening');
                break;
            case Message.RELAY_ORDER:
                let order = new SavedOrder(user.name, message.order.device, message.order.floor);
                let deviceOrders = getSavedDeviceOrders(order.device);
                deviceOrders.set(user.name, order);
                orderRelay(ws, order.device, order.floor);
                break;
            case Message.FETCH_INFO:
                sendInfo(ws, message.fetch);
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
