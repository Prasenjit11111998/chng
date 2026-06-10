type BlinkCallback = (visible: boolean) => void;

class BlinkService {
  private subscribers: Set<BlinkCallback> = new Set();
  private visible = true;
  private interval: any = null;

  subscribe(callback: BlinkCallback) {
    this.subscribers.add(callback);
    // Immediately notify of current state
    callback(this.visible);

    if (this.subscribers.size === 1 && !this.interval) {
      this.start();
    }

    return () => {
      this.subscribers.delete(callback);
      if (this.subscribers.size === 0 && this.interval) {
        this.stop();
      }
    };
  }

  private start() {
    this.interval = setInterval(() => {
      this.visible = !this.visible;
      this.subscribers.forEach((cb) => cb(this.visible));
    }, 800);
  }

  private stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}

export const blinkService = new BlinkService();
