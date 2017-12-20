const MySQL = require('../utils/mysql-handler');
const Constants = require('../config/constants');

module.exports = {
    onConnect(username, ws, req) {
        //ws.send('TestApp, Hello: ' + username);
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
    }
};