const mysql = require('mysql');
const mysqlAuth = require('../config/mysql');
const mysqlAuthDev = require('../config/mysql.dev');

let pool = null;

const MysqlHandler = {
    start() {
        let auth = mysqlAuthDev;
        if (process.env.NODE_ENV === 'production') {
            auth = mysqlAuth;
        }

        pool = mysql.createPool(auth);

        return new Promise((resolve, reject) => {
            pool.on('acquire', connection => {
                resolve(connection.threadId);
            });
        });
    },
    end() {
        if (pool) {
            pool.end();
        }
    },
    query() {
        return new Promise((resolve, reject) => {
            pool.query(...arguments, (error, result) => {
                if (error) {
                    return reject(error);
                }

                return resolve(result);
            });
        });
    }
};

module.exports = MysqlHandler;
