// Mock console methods
global.console = {
    ...console,
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn()
};

// Mock performance API
global.performance = {
    now: jest.fn(() => Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
    clearMarks: jest.fn(),
    clearMeasures: jest.fn(),
    getEntriesByType: jest.fn(() => []),
    getEntriesByName: jest.fn(() => []),
    getEntries: jest.fn(() => [])
};

// Mock WebSocket
global.WebSocket = class WebSocket {
    constructor(url) {
        this.url = url;
        this.readyState = 0;
        this.onopen = null;
        this.onmessage = null;
        this.onerror = null;
        this.onclose = null;
    }
    send(data) {}
    close() {}
};

// Mock localStorage
const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    clear: jest.fn(),
    removeItem: jest.fn(),
    length: 0,
    key: jest.fn()
};
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    clear: jest.fn(),
    removeItem: jest.fn(),
    length: 0,
    key: jest.fn()
};
global.sessionStorage = sessionStorageMock;

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn(callback => setTimeout(callback, 0));
global.cancelAnimationFrame = jest.fn(id => clearTimeout(id));

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
    constructor(callback) {
        this.callback = callback;
    }
    observe() {}
    unobserve() {}
    disconnect() {}
};

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
    constructor(callback) {
        this.callback = callback;
    }
    observe() {}
    unobserve() {}
    disconnect() {}
};

// Mock matchMedia
global.matchMedia = jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn()
}));

// Mock fetch
global.fetch = jest.fn(() =>
    Promise.resolve({
        json: () => Promise.resolve({}),
        text: () => Promise.resolve(""),
        blob: () => Promise.resolve(new Blob()),
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(0))
    })
);

// Mock URL
global.URL = {
    createObjectURL: jest.fn(),
    revokeObjectURL: jest.fn()
};

// Mock crypto
global.crypto = {
    getRandomValues: jest.fn(arr => {
        for (let i = 0; i < arr.length; i++) {
            arr[i] = Math.floor(Math.random() * 256);
        }
    })
};

// Mock process.env
process.env.NODE_ENV = "test";
process.env.PORT = "3000";
process.env.HOST = "localhost";

// Clean up after each test
afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
});

// Clean up after all tests
afterAll(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
});

// Mock WebGL context
const mockWebGLContext = {
    canvas: document.createElement('canvas'),
    getContext: jest.fn(),
    getExtension: jest.fn(),
    createBuffer: jest.fn(),
    bindBuffer: jest.fn(),
    bufferData: jest.fn(),
    createProgram: jest.fn(),
    createShader: jest.fn(),
    shaderSource: jest.fn(),
    compileShader: jest.fn(),
    attachShader: jest.fn(),
    linkProgram: jest.fn(),
    useProgram: jest.fn(),
    getAttribLocation: jest.fn(),
    getUniformLocation: jest.fn(),
    enableVertexAttribArray: jest.fn(),
    vertexAttribPointer: jest.fn(),
    drawArrays: jest.fn(),
    clear: jest.fn(),
    viewport: jest.fn(),
};

// Mock Three.js
jest.mock('three', () => ({
    Scene: jest.fn(),
    PerspectiveCamera: jest.fn(),
    WebGLRenderer: jest.fn(() => ({
        setSize: jest.fn(),
        render: jest.fn(),
        shadowMap: { enabled: true },
    })),
    AmbientLight: jest.fn(),
    DirectionalLight: jest.fn(),
    Mesh: jest.fn(),
    BoxGeometry: jest.fn(),
    SphereGeometry: jest.fn(),
    MeshStandardMaterial: jest.fn(),
    Vector3: jest.fn(),
    Euler: jest.fn(),
    Quaternion: jest.fn(),
    Clock: jest.fn(() => ({
        getDelta: jest.fn(() => 0.016),
    })),
}));

// Mock Cannon.js
jest.mock('cannon-es', () => ({
    World: jest.fn(),
    Body: jest.fn(),
    Box: jest.fn(),
    Sphere: jest.fn(),
    Material: jest.fn(),
    ContactMaterial: jest.fn(),
    Vec3: jest.fn(),
    Quaternion: jest.fn(),
}));

// Mock AudioContext
class MockAudioContext {
    constructor() {
        this.destination = {};
        this.createBufferSource = jest.fn();
        this.createGain = jest.fn();
        this.createAnalyser = jest.fn();
    }
    decodeAudioData() {}
}

global.AudioContext = MockAudioContext; 