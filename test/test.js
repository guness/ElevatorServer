'use strict';

const WebSocket = require('ws');
const app = require('../app');
const Message = require('../config/messageTypes');

const TEST_HOST = 'localhost';//"elevator.onintech.com";

before(done => {
    app.state.on('ready', () => {
        done();
    });
});

after(() => {
    setTimeout(() => {
        console.log('Closing Server App');
        app.close();
    }, 3000);
});

describe('Test Endpoint', () => {
    let wsTest = new WebSocket('ws://sinan:gunes@' + TEST_HOST + ':' + (process.env.PORT || 8080) + '/test');
    wsTest.on('error', err => {
        console.error("Error on 'Test Endpoint' connection: " + err);
    });
    after(() => {
        if (wsTest.readyState !== WebSocket.CLOSED && wsTest.readyState !== WebSocket.CLOSING) {
            wsTest.close(1001, 'After test');
        }
    });
    describe('#ping()', () => {
        it('should fail when no auth', done => {
            let wsTestUnAuth = new WebSocket('ws://' + TEST_HOST + ':' + (process.env.PORT || 8080) + '/test');
            after(() => {
                wsTestUnAuth.close(1001, 'After test');
            });
            wsTestUnAuth.on('error', () => {
                done();
            });
            wsTestUnAuth.on('pong', () => {
                done('success; false positive');
            });

            if (wsTestUnAuth.readyState === WebSocket.OPEN) {
                sendData();
            } else {
                wsTestUnAuth.on('open', () => {
                    sendData();
                });
            }

            function sendData() {
                try {
                    wsTestUnAuth.ping('', false, false);
                    done('success; false positive');
                } catch (err) {
                    console.log(err);
                    done();
                }
            }
        });
        it('should respond with pong', done => {
            wsTest.on('pong', () => {
                done();
            });

            if (wsTest.readyState === WebSocket.OPEN) {
                wsTest.ping('', false, false);
            } else {
                wsTest.on('open', () => {
                    wsTest.ping('', false, false);
                });
            }
        });
    });
    describe('#echo()', () => {
        it('should echo', done => {
            const echo = {
                _type: Message.ECHO,
                argument0: true,
                argument1: 10
            };
            wsTest.on('message', data => {
                const message = JSON.parse(data);
                if (message._type === echo._type && message.argument0 === echo.argument0 && message.argument1 === echo.argument1) {
                    done();
                } else {
                    done('Echo messages do not match');
                }
            });

            if (wsTest.readyState === WebSocket.OPEN) {
                sendData();
            } else {
                wsTest.on('open', () => {
                    sendData();
                });
            }

            function sendData() {
                wsTest.send(JSON.stringify(echo), err => {
                    if (err) {
                        done(err);
                    }
                });
            }
        });
    });
});

describe('Board Endpoint', () => {
    const wsBoard = new WebSocket('ws://sinan:gunes@' + TEST_HOST + ':' + (process.env.PORT || 8080) + '/board');
    after(() => {
        if (wsBoard.readyState !== WebSocket.CLOSED && wsBoard.readyState !== WebSocket.CLOSING) {
            wsBoard.close(1001, 'After test');
        }
    });
    wsBoard.on('error', err => {
        console.error("Error on 'Board Endpoint' connection: " + err);
    });
    describe('#ping()', () => {
        it('should respond with pong', done => {
            wsBoard.on('pong', () => {
                done();
            });

            if (wsBoard.readyState === WebSocket.OPEN) {
                wsBoard.ping('', false, false);
            } else {
                wsBoard.on('open', () => {
                    wsBoard.ping('', false, false);
                });
            }
        });
    });
    describe('#UpdateState', () => {
        it('should be sent successfully', done => {
            const message = {
                "_type": Message.UPDATE_STATE,
                "version": 2,
                "state": {
                    "floor": 5,
                    "busy": false,
                    "direction": "UP"
                }
            };
            wsBoard.send(JSON.stringify(message), err => {
                done(err);
            })
        });
    });
    describe('#UpdateInfo', () => {
        it('should be sent successfully', done => {
            const message = {
                "_type": Message.INFO,
                "version": 2,
                "info": {
                    "floor": 6,
                    "address": "Lorem ipsum dolor sit amet",
                    "description": "Main Elevator",
                    "latitude": 34.33,
                    "longitude": -23.12
                }
            };
            wsBoard.send(JSON.stringify(message), err => {
                done(err);
            })
        });
    });
    describe('#Log', () => {
        it('should be sent successfully', done => {
            const message = {
                "_type": Message.LOG,
                "version": 2,
                "log": {
                    "severity": 2,
                    "description": "Lorem ipsum dolor sit amet"
                }
            };
            wsBoard.send(JSON.stringify(message), err => {
                done(err);
            })
        });
    });
});

describe('Mobile Endpoint', () => {
    const wsMobile = new WebSocket('ws://sinan:gunes@' + TEST_HOST + ':' + (process.env.PORT || 8080) + '/mobile');
    after(() => {
        wsMobile.close(1001, 'After test');
    });
    wsMobile.on('error', err => {
        console.error("Error on 'Mobile Endpoint' connection: " + err);
    });
    describe('#ping()', () => {
        it('should respond with pong', done => {
            wsMobile.on('pong', () => {
                done();
            });

            if (wsMobile.readyState === WebSocket.OPEN) {
                wsMobile.ping('', false, false);
            } else {
                wsMobile.on('open', () => {
                    wsMobile.ping('', false, false);
                });
            }
        });
    });
    describe('#ListenDevice', () => {
        it('should be sent successfully', done => {
            const message = {
                "_type": Message.LISTEN_DEVICE,
                "version": 2,
                "device": "UUID-1234-567-890"
            };
            wsMobile.send(JSON.stringify(message), err => {
                done(err);
            })
        });
    });
});

describe('Invalid Endpoint', () => {
    const wsInvalid = new WebSocket('ws://sinan:gunes@' + TEST_HOST + ':' + (process.env.PORT || 8080) + '/invalid');
    after(() => {
        wsInvalid.close(1001, 'After test');
    });
    wsInvalid.on('error', err => {
        // We can ignore errors here.
        // console.log("Error on 'Invalid Endpoint' connection: " + err);
    });
    describe('#ping()', () => {
        it('should not respond with pong', done => {
            try {
                wsInvalid.ping('', true, false);
                done('success; false positive');
            } catch (err) {
                done();
            }
        });
    });
});
