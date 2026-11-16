const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { DEFAULTS } = require("../defaults.js");
const { SETTINGS, loadConfig, saveSetting } = require("../config.js");

test("the defaults file sets every setting, and only those", () => {
  assert.deepEqual(Object.keys(DEFAULTS).sort(), Object.keys(SETTINGS).sort());
});

test("each default is a value its setting allows", () => {
  for (const [key, value] of Object.entries(DEFAULTS)) {
    assert.ok(SETTINGS[key].includes(value), `${key} = ${value}`);
  }
});

test("each setting in the defaults file has a comment above it", () => {
  const lines = fs
    .readFileSync(path.join(__dirname, "..", "defaults.js"), "utf8")
    .split("\n");
  for (const key of Object.keys(DEFAULTS)) {
    const at = lines.findIndex((line) => line.trim().startsWith(`${key}:`));
    assert.ok(at > 0, `${key} is in defaults.js`);
    assert.match(lines[at - 1].trim(), /^\/\//, `${key} has a comment`);
  }
});

test("an empty user config gives exactly the defaults", () => {
  assert.deepEqual(loadConfig({}), DEFAULTS);
});

test("a user setting replaces its default", () => {
  assert.deepEqual(loadConfig({ browser_action: "tab_glue" }), {
    ...DEFAULTS,
    browser_action: "tab_glue",
  });
});

test("loading doesn't change the defaults", () => {
  loadConfig({ browser_action: "tab_glue" });
  assert.equal(DEFAULTS.browser_action, "tab_scissor_cut");
});

test("an unknown key is refused, naming the closest setting", () => {
  assert.throws(
    () => loadConfig({ browser_actoin: "tab_glue" }),
    /Unknown setting "browser_actoin".*"browser_action"/,
  );
});

test("a value the setting doesn't allow is refused", () => {
  for (const value of ["", "tab_glu", "toString"]) {
    assert.throws(
      () => loadConfig({ browser_action: value }),
      /Setting "browser_action"/,
    );
  }
  assert.throws(
    () => loadConfig({ browser_action: "tab_glu" }),
    /did you mean "tab_glue"/,
  );
});

test("saving a changed value stores it", () => {
  const storage = {};
  saveSetting(storage, "browser_action", "tab_glue_all");
  assert.deepEqual(storage, { browser_action: "tab_glue_all" });
});

test("saving the default value removes the key", () => {
  const storage = { browser_action: "tab_glue" };
  saveSetting(storage, "browser_action", DEFAULTS.browser_action);
  assert.deepEqual(storage, {});
});
