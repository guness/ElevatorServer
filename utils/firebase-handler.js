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
    sendMessage(token, dataPayload, iOSPayload) {
        let message = {
            data: dataPayload,
            priority: "high",
            android: {
                ttl: 60 * 1000
            },
            apns: {
                headers: {
                    "content-available": "1",
                    "apns-priority": "10",
                },
                payload: iOSPayload
            },

            token: token
        };


        admin.messaging().send(message)
            .then(function (response) {
                // See the MessagingDevicesResponse reference documentation for
                // the contents of response.
                console.info(Moment().format() + ' Successfully sent message: ' + JSON.stringify(response));
            })
            .catch(function (error) {
                console.warn(Moment().format() + ' Error sending message: ' + error);
            });
    },
    sendArrivedMessage(token, dataPayload, floor) {
        let iOSPayload = {
            aps: {
                alert: {
                    title: 'Your elevator has arrived',
                    body: 'Floor ' + floor,
                },
                badge: 42,
            }
        };
        sendMessage(token, dataPayload, iOSPayload)
    }
};