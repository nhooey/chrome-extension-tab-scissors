// The options page. options.html loads defaults.js, config.js and tabLogic.js
// before this file, for loadConfig, saveSetting and buttonFor.

function restoreOptions() {
  const button = buttonFor(loadConfig(localStorage).browser_action);
  chrome.browserAction.setTitle({ title: button.title });
  chrome.browserAction.setIcon({ path: button.icon });
  //TODO: create an option for always making the window fullscreen size
}

// Saves options to localStorage, keeping only what differs from the defaults.
function save_options() {
  var select = document.getElementById("key");
  var key = select.children[select.selectedIndex].value;
  saveSetting(localStorage, "browser_action", key);

  // Update status to let user know options were saved.
  var status = document.getElementById("status");
  status.innerHTML = "Options Saved.";
  setTimeout(function () {
    status.innerHTML = "";
  }, 750);

  restoreOptions();
}

// Sets the select box to the setting in effect.
function restore_options() {
  var action = loadConfig(localStorage).browser_action;
  var select = document.getElementById("key");
  for (var i = 0; i < select.children.length; i++) {
    var child = select.children[i];
    if (child.value == action) {
      child.selected = "true";
      break;
    }
  }
}
