const WebSocket = require('ws');
const Auth = require('basic-auth');
const MySQL = require('./mysql-handler');
const Message = require('./config/messageTypes');
const BoardApp = require('./board/BoardApp');
const MobileApp = require('./mobile/MobileApp');
const TestApp = require('./test/TestApp');

MySQL.start();

const wss = new WebSocket.Server({
    port: process.env.PORT || 8080,
    verifyClient: checkAuth
});

function checkAuth(info, cb) {
    const user = Auth(info.req);

    MySQL.query("SELECT 1");

    if (user && user.name === 'sinan' && user.pass === 'gunes') {
        cb(true);
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

wss.on('connection', (ws, req) => {
        const user = Auth(req);
        let module;
        switch (req.url) {
            case '/board':
                module = BoardApp;
                break;
            case '/mobile':
                module = MobileApp;
                break;
            case '/test':
                module = TestApp;
                break;
            default:
                module = undefined;
        }

        if (module) {
            module.onConnect(user.name, ws, req);
            ws.on('message', data => {
                const message = JSON.parse(data);

                switch (message.type) {
                    case undefined:
                    case null:
                    case '':
                        closeNice(ws, 1002, 'Unknown message type');
                        console.error('Unknown message type');
                        //TODO: error log
                        break;
                    case Message.ECHO:
                        ws.send(data);
                        break;
                    default:
                        module.onMessage(ws, req, message);
                        break;
                }
            });

            ws.on('close', () => {
                module.onClose(ws, req);
            });
            ws.on('error', (err) => {
                console.error('error: ' + err);
            });
        } else {
            closeNice(ws, 1002, 'Unknown device type');
            console.error('Unknown device type for url: ' + req.url);
            //TODO: error log
        }
    }
);
module.exports = {
    close() {
        wss.close()
    }
};