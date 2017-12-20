'use strict';

const DB_PREFIX = 'elv_';

module.exports = {
    DB_PREFIX,
    tableNames: {
        MOBILE: `${DB_PREFIX}mobile`,
        BOARD: `${DB_PREFIX}board`,
        BOARD_GROUP: `${DB_PREFIX}boardGroup`,
    }
};