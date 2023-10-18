const fs = require("fs");

const STATES = {
  idle: 0,
  running: 1,
  stop: 2,
  restart: 3,
};

class Timer {
  #bar;
  #state;

  constructor() {
    /**
     * @type {import("vscode").StatusBarItem}
     */
    this.#bar = null;
    /**
     * @type {NodeJS.Timeout}
     */
    this.interval = null;
    /**
     * @type {Date}
     */
    this.startDate = undefined;

    this.#state = STATES.idle;
    this.id = this.generateId();
  }

  get bar() {
    if (!this.#bar) {
      throw new Error("Timer isn't initialized yet");
    }

    return this.#bar;
  }

  get isRunning() {
    return this.#state === STATES.running;
  }

  /**
   * @param {import("vscode").StatusBarItem} bar
   */
  set bar(bar) {
    this.#bar = bar;
  }

  generateId() {
    return Math.floor(new Date().getTime() / 1000);
  }

  stop() {
    this.#state = STATES.stop;
    this.refreshBar();
  }

  write() {
    const data =
      `Started At: ${this.startDate.toLocaleDateString("en-US")}\n` +
      `Duration: ${this.elapsed().time}`;

    fs.writeFileSync(`${__dirname}/sessions/${this.id}.log`, data);
  }

  start() {
    if (this.#state === STATES.running) {
      throw new Error("Timer is already running");
    }
    this.#state = STATES.running;
    if (this.#state !== STATES.stop) {
      this.startDate = new Date();
    }
    this.loop();
  }

  loop() {
    if (this.#state === STATES.stop) {
      this.#state = STATES.idle;
      return;
    }
    if (this.#state === STATES.restart) {
      this.#state = STATES.idle;
      this.start();
      return;
    }
    this.refreshBar();
    setTimeout(() => this.loop(), 1000).unref();
  }

  restart() {
    this.#state = STATES.restart;
  }

  elapsed() {
    const _seconds = Math.floor((Date.now() - this.startDate) / 1000);

    const seconds = `${_seconds % 60}`.padStart(2, "0");
    const minutes = `${Math.floor(_seconds / 60) % 60}`.padStart(2, "0");
    const hours = `${Math.floor(_seconds / 3600)}`.padStart(2, "0");

    return {
      time: `${hours}:${minutes}:${seconds}`,
      shouldWrite: seconds === 59,
    };
  }

  refreshBar() {
    const { time, shouldWrite } = this.elapsed();

    this.bar.text = `${time} ${
      this.#state === STATES.stop ? "Stopped" : "Elapsed"
    }`;
    this.bar.show();
    if (shouldWrite) {
      this.write();
    }
  }
}

module.exports = new Timer();
