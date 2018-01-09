'use strict';

class DeviceState {
    constructor(device) {
        this.online = false;
        this.floor = undefined;
        this.busy = undefined;
        this.direction = undefined;
        this.action = undefined;
        this.device = device;
    }

    goOnline(floor) {
        this.floor = floor;
    }

    applyPatch(diff) {
        this.online = diff.online;
        if (this.online) {
            this.floor = diff.floor;
            this.busy = diff.busy;
            this.direction = diff.direction;
            this.action = diff.action;
        } else {
            this.floor = undefined;
            this.busy = undefined;
            this.direction = undefined;
            this.action = undefined;
        }
    }
}

module.exports = DeviceState;
