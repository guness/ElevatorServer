const WebSocket = require('ws');
const app = require('../app');

after(() => {
    console.log('Closing Server App');
    app.close();
});

describe('Test Endpoint', () => {
    let wsTest;
    before(() => {
        wsTest = new WebSocket('ws://sinan:gunes@localhost:' + (process.env.PORT || 8080) + '/test');
    });
    after(() => {
        wsTest.close(1001, 'After test');
    });

    describe('#ping()', () => {
        it('should fail when no auth', done => {
            let wsTestUnAuth = new WebSocket('ws://localhost:' + (process.env.PORT || 8080) + '/test');
            after(() => {
                wsTestUnAuth.close(1001, 'After test');
            });
            wsTestUnAuth.on('pong', () => {
                done('success; false positive');
            });

            try {
                wsTestUnAuth.ping('', true, false);
                done('success; false positive');
            } catch (err) {
                done();
            }
        });
        it('should respond with pong', done => {
            wsTest.on('pong', () => {
                done();
            });

            wsTest.ping('', false, false)
        });
    });
    describe('#echo()', () => {
        it('should echo', done => {
            const echo = {
                type: 'Echo',
                argument0: true,
                argument1: 10
            };
            wsTest.on('message', data => {
                const message = JSON.parse(data);
                if (message.type === echo.type && message.argument0 === echo.argument0 && message.argument1 === echo.argument1) {
                    done();
                } else {
                    done('Echo messages do not match');
                }
            });
            wsTest.send(JSON.stringify(echo), err => {
                if (err) {
                    done(err);
                }
            });
        });
    });
});

describe('Board Endpoint', () => {
    const wsBoard = new WebSocket('ws://sinan:gunes@localhost:' + (process.env.PORT || 8080) + '/board');
    after(() => {
        wsBoard.close(1001, 'After test');
    });

    describe('#ping()', () => {
        it('should respond with pong', done => {
            wsBoard.on('pong', () => {
                done();
            });

            wsBoard.ping('', false, false)
        });
    });
});

describe('Mobile Endpoint', () => {
    const wsMobile = new WebSocket('ws://sinan:gunes@localhost:' + (process.env.PORT || 8080) + '/mobile');
    after(() => {
        wsMobile.close(1001, 'After test');
    });
    describe('#ping()', () => {
        it('should respond with pong', done => {
            wsMobile.on('pong', () => {
                done();
            });

            wsMobile.ping('', false, false)
        });
    });
});

describe('Invalid Endpoint', () => {
    const wsInvalid = new WebSocket('ws://sinan:gunes@localhost:' + (process.env.PORT || 8080) + '/invalid');
    after(() => {
        wsInvalid.close(1001, 'After test');
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