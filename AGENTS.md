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
- `options.html` and `options.js`: the options page, choosing what the
  toolbar button does, saved to `localStorage`.

## Build and test

There is no build step and no test suite. Load the directory as an
unpacked extension at `chrome://extensions` with Developer mode on, and
try it by hand.

`nix develop` installs the project's agent skills into
`.agents/skills/`. `nix fmt` formats the tree with treefmt (nixfmt and
prettier), and `nix flake check` checks the flake and fails on an
unformatted file.
