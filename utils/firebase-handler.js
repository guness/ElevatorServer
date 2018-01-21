'use strict';
const admin = require('firebase-admin');
const Moment = require('moment');

const serviceAccount = require('../config/guness-elevator-firebase-adminsdk-tr05x-eff5f02539');

module.exports = {
    start() {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: 'https://guness-elevator.firebaseio.com'
        });
    },
    sendMessage(token, payload) {
        admin.messaging().sendToDevice(token, payload)
            .then(function (response) {
                // See the MessagingDevicesResponse reference documentation for
                // the contents of response.
                console.debug(Moment().format() + ' Successfully sent message: ' + response);
            })
            .catch(function (error) {
                console.warn(Moment().format() + ' Error sending message: ' + error);
            });

    }
};