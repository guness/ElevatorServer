const mysql = require('mysql');
const mysqlAuth = require('../config/mysql');

let pool = null;

const MysqlHandler = {
    start() {
        pool = mysql.createPool(mysqlAuth);

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
