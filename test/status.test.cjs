const { test } = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const path = require('node:path');

 test('shows the active file creation date and responds to settings and editor changes', () => {
  let settings = { showCreatedInStatusBar: true };
  let callbacks = {};
  let item;
  const output = { hide() {}, clear() {}, appendLine() {}, show() {}, dispose() {} };
  const vscode = {
    StatusBarAlignment: { Left: 1, Right: 2 },
    window: {
      activeTextEditor: { document: { uri: { scheme: 'file' }, fileName: path.resolve(__filename) } },
      createStatusBarItem() { return item = { text: '', show() { this.visible = true; }, hide() { this.visible = false; }, dispose() {} }; },
      createOutputChannel() { return output; },
      onDidChangeActiveTextEditor(fn) { callbacks.editor = fn; return {}; }
    },
    workspace: {
      getConfiguration() { return { get(key) { return settings[key]; } }; },
      onDidSaveTextDocument(fn) { callbacks.save = fn; return {}; },
      onDidChangeConfiguration(fn) { callbacks.config = fn; return {}; }
    },
    commands: { registerCommand(name, fn) { callbacks.command = fn; return {}; } }
  };
  const originalLoad = Module._load;
  try {
    Module._load = function(request, ...args) { return request === 'vscode' ? vscode : originalLoad.call(this, request, ...args); };
    const extension = require('../extension');
    extension.activate({ subscriptions: [] });
    assert.equal(item.visible, true);
    assert.match(item.text, /Created: /);
    settings.showCreatedInStatusBar = false;
    callbacks.config();
    assert.doesNotMatch(item.text, /Created: /);
    vscode.window.activeTextEditor = undefined;
    callbacks.editor();
    assert.equal(item.visible, false);
    extension.deactivate();
  } finally { Module._load = originalLoad; }
});
