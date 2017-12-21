'use strict';

const WebSocket = require('ws');
const Auth = require('basic-auth');
const Util = require('util');
const Moment = require('moment');
const Constants = require('./config/constants');
const MySQL = require('./utils/mysql-handler');
const Message = require('./config/messageTypes');
const BoardApp = require('./board/BoardApp');
const MobileApp = require('./mobile/MobileApp');
const TestApp = require('./test/TestApp');
const EventEmitter = require('events');

const state = new EventEmitter({});

const wss = new WebSocket.Server({
    port: process.env.PORT || 8080,
    verifyClient: checkAuth
});

MySQL.start().then(() => {
    MySQL.query('SELECT 1;')
        .then(() => {
            state.emit('ready');
        })
        .catch(err => {
            state.emit('error');
            console.error(Moment().format() + ' Error querying select 1 on DB: ' + err)
        });
});

function checkAuth(info, cb) {
    const module = findModule(info.req.url);
    const user = Auth(info.req);

    if (module) {
        if (user) {
            user.ip = info.req.connection.remoteAddress;
            module.onAuth(user, cb);
        } else {
            cb(false);
        }
    } else {
        cb(false);
    }
}

function closeNice(ws, code, message) {
    ws.send(JSON.stringify({
        success: false,
        code: code,
        reason: message
    }), () => {
        ws.close();
    });
}

function findModule(url) {
    switch (url) {
        case '/board':
            return BoardApp;
        case '/mobile':
            return MobileApp;
        case '/test':
            return TestApp;
        default:
            return undefined;
    }
}

wss.on('connection', (ws, req) => {
        let module = findModule(req.url);
        if (module) {
            const user = Auth(req);
            module.onConnect(user, ws, req);
            ws.on('message', data => {
                const message = JSON.parse(data);

                switch (message._type) {
                    case undefined:
                    case null:
                    case '':
                        closeNice(ws, 1002, 'Unknown message type');
                        console.error(Moment().format() + ' Unknown message type');
                        //TODO: error log
                        break;
                    case Message.ECHO:
                        ws.send(data);
                        break;
                    default:
                        module.onMessage(user, ws, req, message);
                        break;
                }
            });

            ws.on('close', () => {
                module.onClose(user, ws, req);
            });
            ws.on('error', err => {
                console.error(Moment().format() + ' error: ' + err);
            });
        } else {
            closeNice(ws, 1002, 'Unknown device type');
            console.error(Moment().format() + ' Unknown device type for url: ' + req.url);
            //TODO: error log
        }
    }
);

module.exports = {
    state,
    close() {
        wss.close();
        MySQL.end();
    }
};
