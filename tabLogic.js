// Pure functions behind the split and glue actions: no chrome.* calls and no
// shared state, so the tests in test/ can run them under Node. The extension
// loads this file as a background script before glueTabs.js and splitTabs.js,
// which call these functions as globals.

// Chrome's minimum window width, in pixels.
const MIN_WINDOW_WIDTH = 196;

const DEFAULT_ACTION = "tab_scissor_cut";

const BUTTONS = {
  tab_glue: { title: "Glue tabs", icon: "glueIcon.png" },
  tab_glue_all: { title: "Glue all tabs", icon: "glueIcon.png" },
  tab_scissor_cut: { title: "Split at selected tab", icon: "icon10.png" },
};

// The toolbar action for a value saved by the options page; anything unknown
// or unset falls back to the split.
function actionFor(stored) {
  return Object.prototype.hasOwnProperty.call(BUTTONS, stored)
    ? stored
    : DEFAULT_ACTION;
}

// The toolbar button's title and icon for a saved value.
function buttonFor(stored) {
  return BUTTONS[actionFor(stored)];
}

// The index of the first tab to move into the new window, or null when the
// window can't be split. Splitting at the first tab splits at the second
// instead, so the original window keeps one tab.
function splitIndex(tabs, selectedTabId) {
  const index = tabs.findIndex((tab) => tab.id === selectedTabId);
  if (index === -1) {
    return null;
  }
  if (index === 0) {
    return tabs.length < 2 ? null : 1;
  }
  return index;
}

// The bounds of the two halves of a split window: the original window shrinks
// to `left`, and the new window opens at `right`.
function splitLayout(win) {
  const width = Math.max(MIN_WINDOW_WIDTH, Math.round(win.width / 2));
  const half = { top: win.top, width, height: win.height };
  return {
    left: { left: win.left, ...half },
    right: { left: win.left + width, ...half },
  };
}

// Orders windows left to right by their horizontal centre.
function compareByCenter(a, b) {
  return a.left + a.width / 2 > b.left + b.width / 2 ? 1 : -1;
}

// The windows a glue gathers, left to right: normal windows only, and
// minimized ones only when `glueMinimized` is set.
function windowsToGlue(windows, glueMinimized) {
  return windows
    .filter(
      (win) =>
        win.type === "normal" &&
        !(glueMinimized === false && win.state === "minimized"),
    )
    .sort(compareByCenter);
}

// A window's edges.
function boundsOf(win) {
  return {
    top: win.top,
    left: win.left,
    right: win.left + win.width,
    bottom: win.top + win.height,
  };
}

// `bounds` grown to cover `win` too. A window above the screen's top edge
// raises the top only as far as 0.
function growBounds(bounds, win) {
  const edges = boundsOf(win);
  return {
    top: edges.top < bounds.top ? Math.max(0, edges.top) : bounds.top,
    left: Math.min(bounds.left, edges.left),
    right: Math.max(bounds.right, edges.right),
    bottom: Math.max(bounds.bottom, edges.bottom),
  };
}

// The `chrome.windows.update` geometry that fills `bounds`.
function windowFor(bounds) {
  return {
    left: bounds.left,
    top: bounds.top,
    width: bounds.right - bounds.left,
    height: bounds.bottom - bounds.top,
  };
}

if (typeof module !== "undefined") {
  module.exports = {
    MIN_WINDOW_WIDTH,
    actionFor,
    buttonFor,
    splitIndex,
    splitLayout,
    compareByCenter,
    windowsToGlue,
    boundsOf,
    growBounds,
    windowFor,
  };
}
