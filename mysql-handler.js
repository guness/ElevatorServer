const mysql = require('mysql');
const mysqlAuth = require('./config/mysql');

let connection = null;

let connectionPromise;

const MysqlHandler = {
    start() {

        if (connection && connection.state === 'authenticated') {
            return;
        }

        // Create/recreate connection object
        connection = mysql.createConnection(mysqlAuth);

        connection.on('error', err => {
            console.error('Unhandled error on mysql: ' + err.code);
        });

        return new Promise((resolve, reject) => {
            connection.connect(function (err) {
                if (err) {
                    console.log('MySQL server connection error!');
                    return reject(err);
                }
                console.log('MySQL server connection successful!');
                return resolve(connection);
            });
        });
    },
    end() {
        if (connection && connection.state === 'authenticated') {
            connection.end();
        }
    },
    connection: connection,
    query() {
        const promiseFunc = (resolve, reject) => {
            connection.query(...arguments, function (error, result) {
                if (error) {
                    return reject(error);
                }

                return resolve(result);
            });
        };
        //If connection died, reconnect and query
        if (connection.state === 'disconnected') {
            console.log('MySQL connection died. Reconnecting...');
            return MysqlHandler.start().then(() => new Promise(promiseFunc));
        }
        return new Promise(promiseFunc);
    },
    get() {
        return connectionPromise;
    },
};

module.exports = MysqlHandler;