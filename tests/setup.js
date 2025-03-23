const { jest, afterAll } = require('@jest/globals');

// Mock console methods to reduce noise during tests
global.console = {
    ...console,
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn()
};

// Mock performance.now for consistent timing in tests
const originalPerformanceNow = global.performance.now;
global.performance.now = jest.fn(() => 0);

// Mock WebSocket for Colyseus client
global.WebSocket = class {
    constructor(url) {
        this.url = url;
        this.readyState = 0;
        setTimeout(() => {
            this.readyState = 1;
            if (this.onopen) this.onopen();
        }, 0);
    }
    send() {}
    close() {
        this.readyState = 3;
        if (this.onclose) this.onclose();
    }
};

// Mock XMLHttpRequest for Colyseus client
global.XMLHttpRequest = class {
    constructor() {
        this.readyState = 0;
        setTimeout(() => {
            this.readyState = 4;
            if (this.onload) this.onload();
        }, 0);
    }
    open() {}
    send() {}
};

// Restore original performance.now after tests
afterAll(() => {
    global.performance.now = originalPerformanceNow;
}); 