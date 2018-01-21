'use strict';

class SavedOrder {
    constructor(user, device, floor) {
        this.user = user;
        this.device = device;
        this.floor = floor;
    }
}

module.exports = SavedOrder;
