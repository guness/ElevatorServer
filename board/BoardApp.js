const MySQL = require('../utils/mysql-handler');
const Constants = require('../config/constants');

module.exports = {
    onConnect(username, ws, req) {
        //ws.send('BoardApp, Hello: ' + username);
    },
    onMessage(ws, req, message) {

    },
    onClose(ws, req) {

    },
    onAuth(user, cb) {
        MySQL.query('INSERT INTO ?? (username, token) VALUES (?, ?) ON DUPLICATE KEY UPDATE token=?;',
            [Constants.tableNames.MOBILE, user.name, user.pass, user.pass])
            .then(() => {
                cb(true);
            })
            .catch(err => {
                cb(false);
                console.error('Error inserting user: ' + err);
            });
        /*
        MySQL.query('SELECT * FROM ?? WHERE username= ?', [Constants.tableNames.BOARD, user.name])
            .then(result => {
                console.log("results: " + JSON.stringify(result));
            });

        MySQL.query('INSERT INTO ?? (username, token, ip) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE token=?, ip=?;',
            [Constants.tableNames.BOARD, user.name, user.pass, user.ip, user.pass, user.ip])
            .then(() => {
                cb(true);
            })
            .catch(err => {
                cb(false);
                console.error('Error inserting user: ' + err);
            });
            */
    }
};