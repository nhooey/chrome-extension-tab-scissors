// Loads the extension's background scripts, in the manifest's order, into a
// fresh context with a fake `chrome` that records each call and answers
// callbacks at once, then clicks the toolbar button.

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.join(__dirname, "..");
const manifest = JSON.parse(
  fs.readFileSync(path.join(root, "manifest.json"), "utf8"),
);

function load({ windows, currentWindowId, selectedTabId, storage = {} }) {
  const calls = [];
  const listeners = {};
  const record =
    (name, answer) =>
    (...args) => {
      // Through JSON, so objects built in the scripts' realm compare equal
      // to the tests' own.
      const data = args.filter((a) => typeof a !== "function");
      calls.push([name, ...JSON.parse(JSON.stringify(data))]);
      const callback = args.find((a) => typeof a === "function");
      if (callback && answer) callback(answer(...args));
    };
  const byId = (id) => windows.find((w) => w.id === id);
  const chrome = {
    windows: {
      getCurrent: record("windows.getCurrent", () => byId(currentWindowId)),
      getAll: record("windows.getAll", () => structuredClone(windows)),
      create: record("windows.create", () => ({ id: 999 })),
      update: record("windows.update"),
    },
    tabs: {
      getAllInWindow: record("tabs.getAllInWindow", (id) => byId(id).tabs),
      getSelected: record("tabs.getSelected", () => ({ id: selectedTabId })),
      move: record("tabs.move"),
      update: record("tabs.update"),
    },
    browserAction: {
      setTitle: record("browserAction.setTitle"),
      setIcon: record("browserAction.setIcon"),
      onClicked: { addListener: (f) => (listeners.click = f) },
    },
    commands: { onCommand: { addListener: () => {} } },
  };
  const context = vm.createContext({
    chrome,
    localStorage: storage,
    console,
  });
  for (const script of manifest.background.scripts) {
    vm.runInContext(fs.readFileSync(path.join(root, script), "utf8"), context, {
      filename: script,
    });
  }
  context.click = () => listeners.click();
  // A timeout, so a click that never returns fails instead of hanging.
  const click = () => vm.runInContext("click()", context, { timeout: 2000 });
  return { calls, click };
}

const named = (calls, name) =>
  calls.filter(([n]) => n === name).map(([, ...args]) => args);

const window = (id, left, tabIds, extra = {}) => ({
  id,
  left,
  top: 0,
  width: 800,
  height: 600,
  type: "normal",
  state: "normal",
  tabs: tabIds.map((tabId) => ({ id: tabId })),
  ...extra,
});

test("loading sets the toolbar button from the saved action", () => {
  const { calls } = load({
    windows: [],
    storage: { browser_action: "tab_glue_all" },
  });
  assert.deepEqual(named(calls, "browserAction.setTitle"), [
    [{ title: "Glue all tabs" }],
  ]);
  assert.deepEqual(named(calls, "browserAction.setIcon"), [
    [{ path: "glueIcon.png" }],
  ]);
});

test("clicking with no saved action splits at the selected tab", () => {
  const { calls, click } = load({
    windows: [window(1, 100, [10, 11, 12, 13])],
    currentWindowId: 1,
    selectedTabId: 11,
  });
  click();
  assert.deepEqual(named(calls, "windows.create"), [
    [{ tabId: 11, left: 500, top: 0, width: 400, height: 600 }],
  ]);
  assert.deepEqual(named(calls, "windows.update"), [
    [1, { left: 100, top: 0, width: 400, height: 600 }],
  ]);
  assert.deepEqual(named(calls, "tabs.move"), [
    [12, { windowId: 999, index: 1 }],
    [13, { windowId: 999, index: 2 }],
  ]);
  assert.deepEqual(named(calls, "tabs.update"), [[11, { selected: true }]]);
});

test("clicking split in a one-tab window does nothing", () => {
  const { calls, click } = load({
    windows: [window(1, 0, [10])],
    currentWindowId: 1,
    selectedTabId: 10,
  });
  click();
  assert.deepEqual(named(calls, "windows.create"), []);
  assert.deepEqual(named(calls, "windows.update"), []);
});

test("clicking glue moves the right window's tabs into the left one", () => {
  const { calls, click } = load({
    windows: [
      window(2, 800, [20, 21], { top: 40 }),
      window(1, 0, [10, 11]),
      window(3, 400, [30], { state: "minimized" }),
    ],
    currentWindowId: 2,
    selectedTabId: 21,
    storage: { browser_action: "tab_glue" },
  });
  click();
  assert.deepEqual(named(calls, "tabs.move"), [
    [20, { windowId: 1, index: 2 }],
    [21, { windowId: 1, index: 3 }],
  ]);
  assert.deepEqual(named(calls, "tabs.update"), [[21, { selected: true }]]);
  assert.deepEqual(named(calls, "windows.update"), [
    [1, { left: 0, top: 0, width: 1600, height: 640, focused: true }],
  ]);
});

test("clicking glue all also gathers minimized windows", () => {
  const { calls, click } = load({
    windows: [window(1, 0, [10]), window(3, 400, [30], { state: "minimized" })],
    currentWindowId: 1,
    selectedTabId: 10,
    storage: { browser_action: "tab_glue_all" },
  });
  click();
  assert.deepEqual(named(calls, "tabs.move"), [
    [30, { windowId: 1, index: 1 }],
  ]);
});

test(
  "clicking glue gathers every window, not just the second",
  {
    todo: "glueTabs.js moveTabs reuses the outer loop's `j` in its inner loop, so with three windows it loops forever",
  },
  () => {
    const { calls, click } = load({
      windows: [window(1, 0, [10]), window(2, 400, [20]), window(3, 800, [30])],
      currentWindowId: 1,
      selectedTabId: 10,
      storage: { browser_action: "tab_glue" },
    });
    click();
    assert.deepEqual(named(calls, "tabs.move"), [
      [20, { windowId: 1, index: 1 }],
      [30, { windowId: 1, index: 2 }],
    ]);
  },
);
