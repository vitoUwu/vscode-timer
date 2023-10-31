const vscode = require("vscode");
const timer = require("./src/timer.js");
const fs = require("fs");

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  const statusBar = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100,
  );

  timer.bar = statusBar;
  timer.start();

  const resetAndSave = vscode.commands.registerCommand(
    "timer.resetAndSave",
    () => {
      timer.stop();
      timer.write();
      timer.start();
      vscode.window.showInformationMessage(
        "Timer saved and restarted sucessfully",
      );
    },
  );

  const _continue = vscode.commands.registerCommand("timer.continue", () => {
    timer.continue();
    vscode.window.showInformationMessage("Timer is running again");
  });

  const save = vscode.commands.registerCommand("timer.save", () => {
    timer.write();
    vscode.window.showInformationMessage("Timer saved successfully");
  });

  const reset = vscode.commands.registerCommand("timer.reset", () => {
    timer.restart();
    vscode.window.showInformationMessage("Timer restarted sucessfully");
  });

  const start = vscode.commands.registerCommand("timer.start", () => {
    if (timer.isRunning) {
      return vscode.window.showWarningMessage("Timer is already running");
    }

    timer.start();
    vscode.window.showInformationMessage("Timer started sucessfully");
  });

  const stop = vscode.commands.registerCommand("timer.stop", () => {
    timer.stop();
    vscode.window.showInformationMessage("Timer stopped sucessfully");
  });

  context.subscriptions.push(_continue);
  context.subscriptions.push(resetAndSave);
  context.subscriptions.push(reset);
  context.subscriptions.push(stop);
  context.subscriptions.push(start);
  context.subscriptions.push(save);
}

function deactivate() {
  timer.stop({ save: true });
}

module.exports = {
  activate,
  deactivate,
};
