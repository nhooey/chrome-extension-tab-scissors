const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
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
} = require("../tabLogic.js");

const tabs = (...ids) => ids.map((id) => ({ id }));

test("actionFor keeps each known action", () => {
  for (const action of ["tab_glue", "tab_glue_all", "tab_scissor_cut"]) {
    assert.equal(actionFor(action), action);
  }
});

test("actionFor falls back to the split for unset or unknown values", () => {
  for (const stored of [undefined, null, "", "tab_glu", "toString"]) {
    assert.equal(actionFor(stored), "tab_scissor_cut");
  }
});

test("buttonFor gives each action its title and icon", () => {
  assert.deepEqual(buttonFor("tab_glue"), {
    title: "Glue tabs",
    icon: "glueIcon.png",
  });
  assert.deepEqual(buttonFor("tab_glue_all"), {
    title: "Glue all tabs",
    icon: "glueIcon.png",
  });
  assert.deepEqual(buttonFor("tab_scissor_cut"), {
    title: "Split at selected tab",
    icon: "icon10.png",
  });
  assert.deepEqual(buttonFor(undefined), buttonFor("tab_scissor_cut"));
});

test("splitIndex splits at the selected tab", () => {
  assert.equal(splitIndex(tabs(10, 11, 12, 13), 12), 2);
  assert.equal(splitIndex(tabs(10, 11, 12, 13), 13), 3);
});

test("splitIndex splits at the second tab when the first is selected", () => {
  assert.equal(splitIndex(tabs(10, 11, 12), 10), 1);
});

test("splitIndex refuses a window with a single tab", () => {
  assert.equal(splitIndex(tabs(10), 10), null);
});

test("splitIndex refuses a selected tab that isn't in the window", () => {
  assert.equal(splitIndex(tabs(10, 11), 99), null);
});

test("splitLayout halves the window side by side", () => {
  const halves = splitLayout({ left: 100, top: 50, width: 1000, height: 800 });
  assert.deepEqual(halves.left, {
    left: 100,
    top: 50,
    width: 500,
    height: 800,
  });
  assert.deepEqual(halves.right, {
    left: 600,
    top: 50,
    width: 500,
    height: 800,
  });
});

test("splitLayout rounds an odd width", () => {
  const halves = splitLayout({ left: 0, top: 0, width: 1001, height: 10 });
  assert.equal(halves.left.width, 501);
  assert.equal(halves.right.left, 501);
});

test("splitLayout never goes below Chrome's minimum window width", () => {
  assert.equal(MIN_WINDOW_WIDTH, 196);
  const halves = splitLayout({ left: 20, top: 0, width: 300, height: 10 });
  assert.equal(halves.left.width, 196);
  assert.equal(halves.right.width, 196);
  assert.equal(halves.right.left, 216);
});

test("compareByCenter orders by horizontal centre, not left edge", () => {
  const wideLeft = { left: 0, width: 1000 }; // centre 500
  const narrowRight = { left: 100, width: 100 }; // centre 150
  assert.equal(compareByCenter(wideLeft, narrowRight), 1);
  assert.equal(compareByCenter(narrowRight, wideLeft), -1);
});

const win = (id, left, extra = {}) => ({
  id,
  left,
  width: 100,
  type: "normal",
  state: "normal",
  ...extra,
});

test("windowsToGlue keeps normal windows, left to right", () => {
  const glued = windowsToGlue(
    [win(1, 500), win(2, 0), win(3, 200, { type: "popup" }), win(4, 300)],
    false,
  );
  assert.deepEqual(
    glued.map((w) => w.id),
    [2, 4, 1],
  );
});

test("windowsToGlue skips minimized windows unless asked to glue them", () => {
  const windows = [win(1, 0), win(2, 200, { state: "minimized" })];
  assert.deepEqual(
    windowsToGlue(windows, false).map((w) => w.id),
    [1],
  );
  assert.deepEqual(
    windowsToGlue(windows, true).map((w) => w.id),
    [1, 2],
  );
});

test("boundsOf gives a window's edges", () => {
  assert.deepEqual(boundsOf({ left: 10, top: 20, width: 300, height: 400 }), {
    top: 20,
    left: 10,
    right: 310,
    bottom: 420,
  });
});

test("growBounds covers both windows", () => {
  const bounds = boundsOf({ left: 100, top: 100, width: 100, height: 100 });
  assert.deepEqual(
    growBounds(bounds, { left: 50, top: 80, width: 300, height: 500 }),
    { top: 80, left: 50, right: 350, bottom: 580 },
  );
});

test("growBounds leaves bounds that already cover the window", () => {
  const bounds = { top: 0, left: 0, right: 1000, bottom: 1000 };
  assert.deepEqual(
    growBounds(bounds, { left: 10, top: 10, width: 10, height: 10 }),
    bounds,
  );
});

test("growBounds stops the top at the screen's edge", () => {
  const bounds = boundsOf({ left: 0, top: 50, width: 100, height: 100 });
  assert.equal(
    growBounds(bounds, { left: 0, top: -30, width: 100, height: 100 }).top,
    0,
  );
});

test("windowFor turns bounds into window geometry", () => {
  assert.deepEqual(windowFor({ top: 80, left: 50, right: 350, bottom: 580 }), {
    left: 50,
    top: 80,
    width: 300,
    height: 500,
  });
});
