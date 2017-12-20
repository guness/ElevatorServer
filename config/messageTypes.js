'use strict';

/**
 * X : Any
 * B : Board
 * S : Server
 * M : Mobile
 *
 * A->B : message comes from A, delivered to B
 */

module.exports = {

    // X->X
    ECHO: 'Echo',

    // B->S
    LOG: 'Log',

    // B->M
    UPDATE_STATE: 'UpdateState',

    // M->B
    RELAY_ORDER: 'RelayOrder',

    // M->S
    LISTEN_DEVICE: 'ListenDevice'
};