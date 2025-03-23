export default class PerformanceOverlay {
  constructor() {
    this.container = document.createElement("div");
    this.container.id = "performance-overlay";
    // FPS counter
    this.fpsElement = document.createElement("div");
    this.container.appendChild(this.fpsElement);
    // Frame time
    this.frameTimeElement = document.createElement("div");
    this.container.appendChild(this.frameTimeElement);
    // Memory usage
    this.memoryElement = document.createElement("div");
    this.container.appendChild(this.memoryElement);
    // Initialize metrics
    this.metrics = {
      fps: 0,
      frameTime: 0,
      frames: 0,
      lastTime: performance.now(),
      lastFPSUpdate: performance.now(),
    };
  }
  update(deltaTime) {
    // Update frame counter
    this.metrics.frames++;
    // Update frame time
    this.metrics.frameTime = deltaTime * 1000;
    const now = performance.now();
    const elapsed = now - this.metrics.lastFPSUpdate;
    // Update FPS every second
    if (elapsed >= 1000) {
      this.metrics.fps = Math.round((this.metrics.frames * 1000) / elapsed);
      this.metrics.frames = 0;
      this.metrics.lastFPSUpdate = now;
      // Update display
      this.updateDisplay();
    }
  }
  updateDisplay() {
    // Update FPS display
    this.fpsElement.textContent = `FPS: ${this.metrics.fps}`;
    // Update frame time display
    this.frameTimeElement.textContent = `Frame Time: ${this.metrics.frameTime.toFixed(2)}ms`;
    // Update memory usage if available
    if (window.performance && window.performance.memory) {
      const memory = window.performance.memory;
      const usedHeap = (memory.usedJSHeapSize / 1048576).toFixed(2);
      const totalHeap = (memory.totalJSHeapSize / 1048576).toFixed(2);
      this.memoryElement.textContent = `Memory: ${usedHeap}MB / ${totalHeap}MB`;
    }
  }
  show() {
    this.container.style.display = "block";
  }
  hide() {
    this.container.style.display = "none";
  }
  cleanup() {
    if (this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}
