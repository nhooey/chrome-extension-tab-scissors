# Tab Scissors

A Chrome extension (Manifest V2) that splits a window into two at the
selected tab, or glues a window's tabs back together, by its toolbar
button.

- `manifest.json`: the extension's manifest.
- `splitTabs.js`: the background script that moves the selected tab
  and those after it into a new window.
- `glueTabs.js`: the background script that moves other windows' tabs
  into the current one, and the toolbar button's handler, which runs
  the split or a glue as the options page chose.
- `tabLogic.js`: the pure functions behind both actions (where the
  split falls, the window geometry, which windows a glue gathers, and
  the toolbar button for each saved action), loaded first as a
  background script and by the tests under Node.
- `options.html` and `options.js`: the options page, choosing what the
  toolbar button does, saved to `localStorage`.
- `test/`: `node:test` suites. `tabLogic.test.js` tests the pure
  functions; `background.test.js` loads the background scripts in the
  manifest's order against a recording fake `chrome` and clicks the
  toolbar button.

## Build and test

There is no build step. `node --test test/*.test.js` runs the tests,
and `nix flake check` runs them too. To try the extension, load the
directory as an unpacked extension at `chrome://extensions` with
Developer mode on.

`nix develop` installs the project's agent skills into
`.agents/skills/`. `nix fmt` formats the tree with treefmt (nixfmt and
prettier), and `nix flake check` checks the flake and fails on an
unformatted file.
