'use strict';

class DeviceState {
    constructor(device) {
        this.online = false;
        this.floor = undefined;
        this.busy = undefined;
        this.direction = undefined;
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
        } else {
            this.floor = undefined;
            this.busy = undefined;
            this.direction = undefined;
        }
    }
}

module.exports = DeviceState;
