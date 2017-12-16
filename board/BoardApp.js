module.exports = {
    onConnect(ws, req) {
        ws.send('BoardApp');
    },
    onMessage(ws, req, message) {

    },
    onClose(ws, req) {

    }
};