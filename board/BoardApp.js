'use strict';

const Moment = require('moment');
const EventEmitter = require('events');
const MySQL = require('../utils/mysql-handler');
const Constants = require('../config/constants');
const Message = require('../config/messageTypes');
const DeviceState = require('../models/DeviceState');

const boardMap = new Map();
const stateEmitter = new EventEmitter();

function updateState(username, patch) {
    const state = boardMap.get(username).state;
    state.applyPatch(patch);
    stateEmitter.emit(Message.UPDATE_STATE, username, state);
}

function setInfo(username, info) {
    MySQL.query('UPDATE ?? SET ? WHERE username = ?;', [Constants.tableNames.BOARD, info, username])
        .then(() => {
            console.info(Moment().format() + ' Updating Board info: ' + JSON.stringify(info));
        })
        .catch(err => {
            console.error(Moment().format() + ' Error setting Board info: ' + err);
        });
}

function addLog(username, log) {
    log.board_name = username;
    MySQL.query('INSERT INTO ?? SET ?;', [Constants.tableNames.LOG, log])
        .then(() => {
            console.info(Moment().format() + ' LOGGED by Board: ' + JSON.stringify(log));
        })
        .catch(err => {
            console.error(Moment().format() + ' Error inserting LOG: ' + err);
        });
}

module.exports = {
    stateEmitter: stateEmitter,
    getState(username) {
        return boardMap.get(username);
    },
    onConnect(user, ws, req) {
        boardMap.set(user.name, {user: user, ws: ws, state: new DeviceState()});
        console.info(Moment().format() + ' Total Boards connected: ' + boardMap.size + ' new Board: ' + user.name);
    },
    onMessage(user, ws, req, message) {
        switch (message._type) {
            case Message.UPDATE_STATE:
                message.online = true;
                updateState(user.name, message);
                console.info(Moment().format() + ' Updating Board state: ' + JSON.stringify(message));
                break;
            case Message.INFO:
                setInfo(user.name, message.info);
                break;
            case Message.LOG:
                addLog(user.name, message.log);
                break;
            default:
                console.warn(Moment().format() + ' Unhandled Board message: ' + JSON.stringify(message));
                break;
        }
    },
    onClose(user, ws, req) {
        updateState(user.name, {online: false});
        boardMap.delete(user.name);
        console.info(Moment().format() + ' Total Boards connected: ' + boardMap.size + ' Board disconnected: ' + user.name);
    },
    onAuth(user, cb) {
        MySQL.query('SELECT * FROM ?? WHERE username = ?', [Constants.tableNames.BOARD, user.name])
            .then(result => {
                if (result[0]) {
                    if (result[0].token === user.pass) {
                        console.info(Moment().format() + ' Auth SUCCESS for Board: ' + JSON.stringify(user));
                        cb(true);
                    } else {
                        console.error(Moment().format() + ' Auth FAIL for Board: ' + JSON.stringify(user));
                        cb(false);
                    }
                } else {
                    console.warn(Moment().format() + ' Unregistered Board detected, registering now: ' + JSON.stringify(user));
                    MySQL.query('INSERT INTO ?? (username, token, ip) VALUES (?, ?, ?);',
                        [Constants.tableNames.BOARD, user.name, user.pass, user.ip])
                        .then(() => {
                            cb(true);
                        })
                        .catch(err => {
                            console.error(Moment().format() + ' Error registering Board: ' + err);
                            cb(false);
                        });
                }
            })
            .catch(err => {
                console.error(Moment().format() + ' Error on MySQL connection: ' + err);
                cb(false);
            });
    }
};
