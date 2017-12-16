module.exports = {
    onConnect(ws, req) {
        ws.send('MobileApp');
    },
    onMessage(ws, req, message) {

    },
    onClose(ws, req) {

    }
};