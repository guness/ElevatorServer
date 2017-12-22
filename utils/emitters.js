'use strict';

const EventEmitter = require('events');
const stateEmitter = new EventEmitter();
const orderEmitter = new EventEmitter();

module.exports = {
    getStateEmitter() {
        return stateEmitter;
    },
    getOrderEmitter() {
        return orderEmitter;
    }
};