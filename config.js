// Reads the extension's settings: the shipped defaults in defaults.js, with
// the user's saved settings merged over them key by key. No code past this
// file holds a default of its own. The extension loads this file after
// defaults.js, as a background script and on the options page; the tests in
// test/ load it under Node.

// In the browser, defaults.js has already defined DEFAULTS as a global.
const SHIPPED =
  typeof DEFAULTS !== "undefined"
    ? DEFAULTS
    : require("./defaults.js").DEFAULTS;

// The values each setting allows. Every setting in DEFAULTS is here, and
// every setting here is in DEFAULTS; test/config.test.js checks both.
const SETTINGS = {
  browser_action: ["tab_scissor_cut", "tab_glue", "tab_glue_all"],
};

// The number of single-character edits between two strings.
function editDistance(a, b) {
  let row = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const next = [i];
    for (let j = 1; j <= b.length; j++) {
      next[j] = Math.min(
        row[j] + 1,
        next[j - 1] + 1,
        row[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    row = next;
  }
  return row[b.length];
}

// The known name closest to `name`.
function closest(name, names) {
  return names.reduce((best, candidate) =>
    editDistance(name, candidate) < editDistance(name, best) ? candidate : best,
  );
}

// The settings in effect: the shipped defaults with each key in `user`
// replacing its default. `user` is `localStorage`, or any object holding only
// settings the user changed. Throws on a key no setting has, or a value its setting
// doesn't allow, naming the key and the closest valid name.
function loadConfig(user) {
  const config = { ...SHIPPED };
  const known = Object.keys(SETTINGS);
  for (const key of Object.keys(user)) {
    if (!Object.prototype.hasOwnProperty.call(SETTINGS, key)) {
      throw new Error(
        `Unknown setting "${key}" in localStorage; did you mean "${closest(key, known)}"?`,
      );
    }
    const value = user[key];
    if (!SETTINGS[key].includes(value)) {
      throw new Error(
        `Setting "${key}" in localStorage is "${value}", which isn't one of ` +
          `${SETTINGS[key].map((v) => `"${v}"`).join(", ")}; ` +
          `did you mean "${closest(String(value), SETTINGS[key])}"?`,
      );
    }
    config[key] = value;
  }
  return config;
}

// Saves `value` for `key` in `storage`, keeping it sparse: a value equal to
// the default removes the key, so a later change of default reaches the user.
function saveSetting(storage, key, value) {
  if (value === SHIPPED[key]) {
    delete storage[key];
  } else {
    storage[key] = value;
  }
}

if (typeof module !== "undefined") {
  module.exports = { SETTINGS, loadConfig, saveSetting };
}
