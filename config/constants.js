'use strict';

const DB_PREFIX = 'elv_';

module.exports = {
    DB_PREFIX,
    tableNames: {
        MOBILE: `${DB_PREFIX}mobile`,
        BOARD: `${DB_PREFIX}board`,
        GROUP: `${DB_PREFIX}group`,
        LOG: `${DB_PREFIX}log`
    }
};
