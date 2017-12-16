module.exports = {
    onConnect(ws, req) {
        ws.send('TestApp');
    },
    onMessage(ws, req, message) {

    },
    onClose(ws, req) {

    }
};