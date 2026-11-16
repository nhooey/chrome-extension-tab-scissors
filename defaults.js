// The extension's shipped defaults: every setting it reads, each set to its
// default. The options page saves only the settings a user changes, to
// `localStorage` under the same keys, and config.js merges those over this.
// Don't copy defaults into code: read them through `loadConfig`.

const DEFAULTS = {
  // What a click on the toolbar button does.
  //   "tab_scissor_cut": split the window into two at the selected tab.
  //   "tab_glue":        move every normal window's tabs into the leftmost
  //                      window, leaving minimized windows alone.
  //   "tab_glue_all":    as "tab_glue", gathering minimized windows too.
  browser_action: "tab_scissor_cut",
};

if (typeof module !== "undefined") {
  module.exports = { DEFAULTS };
}
