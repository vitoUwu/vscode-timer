const fs = require("fs");
const { ThemeColor } = require("vscode");

const STATES = {
  idle: 0,
  running: 1,
  stop: 2,
  restart: 3,
};

class Timer {
  #bar;
  #state;
  #seconds;

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

    this.#seconds = 0;
    this.#state = STATES.idle;
    this.id = this.generateId();
  }

  get bar() {
    if (!this.#bar) {
      throw new Error("Timer isn't initialized yet");
    }

    return this.#bar;
  }

  /**
   * @param {import("vscode").StatusBarItem} bar
   */
  set bar(bar) {
    this.#bar = bar;
  }

  get isRunning() {
    return this.#state === STATES.running;
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
      `Duration: ${this.elapsed().formatted}`;

    fs.writeFileSync(`${__dirname}/sessions/${this.id}.log`, data);
  }

  continue() {
    if (this.#state === STATES.running) {
      throw new Error("Timer is already running");
    }

    this.#state = STATES.running;
    this.bar.command = "timer.stop";
    this.loop();
  }

  start() {
    if (this.#state === STATES.running) {
      throw new Error("Timer is already running");
    }

    this.startDate = new Date();
    this.#seconds = 0;
    this.#state = STATES.running;
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
    this.#seconds += 1;
    setTimeout(() => this.loop(), 1000).unref();
  }

  reset() {
    this.#seconds = 0;
    if (this.#state === STATES.idle) {
      this.refreshBar();
    }
  }

  elapsed() {
    const seconds = `${this.#seconds % 60}`.padStart(2, "0");
    const minutes = `${Math.floor(this.#seconds / 60) % 60}`.padStart(2, "0");
    const hours = `${Math.floor(this.#seconds / 3600)}`.padStart(2, "0");

    return {
      formatted: `${hours}:${minutes}:${seconds}`,
      seconds,
      minutes,
      hours,
    };
  }

  refreshBar() {
    const { formatted, seconds } = this.elapsed();

    if (this.#state === STATES.running) {
      this.bar.command = "timer.stop";
      this.bar.tooltip = "Stop";
      this.bar.color = undefined;
      this.bar.backgroundColor = undefined;
      this.bar.text = `${formatted} Elapsed`;
    }

    if (this.#state === STATES.idle || this.#state === STATES.stop) {
      this.bar.command = "timer.continue";
      this.bar.tooltip = "Continue";
      this.bar.color = new ThemeColor("statusBarItem.warningForeground");
      this.bar.backgroundColor = new ThemeColor(
        "statusBarItem.warningBackground",
      );
      this.bar.text = `${formatted} ${
        this.#state === STATES.stop
          ? "Stopped"
          : this.#state === STATES.idle
          ? "Idle"
          : "Unknown"
      }`;
    }

    this.bar.show();
    if (seconds === 59) {
      this.write();
    }
  }
}

module.exports = new Timer();
