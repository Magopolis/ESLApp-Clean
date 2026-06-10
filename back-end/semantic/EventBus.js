// Simple in-process event bus.
// Later this can be replaced with Redis, Kafka, etc.

class EventBus {
  constructor() {
    this.listeners = {};
  }

  emit(eventType, payload) {
    console.log(`[EventBus] ${eventType}`, payload);

    if (this.listeners[eventType]) {
      this.listeners[eventType].forEach(fn => fn(payload));
    }
  }

  on(eventType, handler) {
    if (!this.listeners[eventType]) {
      this.listeners[eventType] = [];
    }
    this.listeners[eventType].push(handler);
  }
}

module.exports = new EventBus();
