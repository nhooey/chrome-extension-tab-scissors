// noinspection JSUnresolvedVariable,JSUnresolvedFunction

function TabGlue() {
  this.currentWindow = null;
  this.currentWindowId = null;
  this.tabCount = 0;
  this.glueMinimized = false;
  this.selectedTabId = null;
}

const tgp = TabGlue.prototype;

tgp.start = function () {
  chrome.windows.getCurrent(TabGlue.prototype.getWindows);
};

TabGlue.prototype.storeSelected = function (selected) {
  this.selectedTabId = selected.id;
};

TabGlue.prototype.getTabs = function (tabs) {
  this.tabCount = tabs.length;
  // We require all the tab information to be populated.
  chrome.windows.getAll({ populate: true }, TabGlue.prototype.moveTabs);
};

tgp.getWindows = function (win) {
  this.currentWindow = win;
  this.currentWindowId = win.id;
  chrome.tabs.getSelected(
    this.currentWindowId,
    TabGlue.prototype.storeSelected,
  );
  chrome.tabs.getAllInWindow(this.currentWindow.id, TabGlue.prototype.getTabs);
};

const tabGlue = new TabGlue();

tgp.moveTabs = function (windows) {
  windows = windowsToGlue(windows, tabGlue.glueMinimized);

  const numWindows = windows.length;

  const nTargetWindow = windows[0];
  let bounds = boundsOf(nTargetWindow);
  let tabPosition = nTargetWindow.tabs.length;
  for (let j = 0; j < numWindows; j++) {
    const win = windows[j];
    if (win.id !== nTargetWindow.id) {
      bounds = growBounds(bounds, win);
      const numTabs = win.tabs.length;
      for (j = 0; j < numTabs; j++) {
        const tab = win.tabs[j];

        // Move the tab into the window is furthest to the left and not minimized?
        chrome.tabs.move(tab.id, {
          windowId: nTargetWindow.id,
          index: tabPosition,
        });

        tabPosition++;
      }
    }
  }
  //	Set the selected tab to tab that was selected
  //	in the window where call initiated.
  if (this.selectedTabId != null) {
    chrome.tabs.update(this.selectedTabId, { selected: true });
  }
  //resize the result window to include all the other windows' space.
  const windResizeObj = { ...windowFor(bounds), focused: true };
  chrome.windows.update(nTargetWindow.id, windResizeObj);
};

function tabGlueAction() {
  tabGlue.glueMinimized = false;
  tabGlue.start();
}

function tabGlueAllAction() {
  tabGlue.glueMinimized = true;
  tabGlue.start();
}

function restoreOptions() {
  const button = buttonFor(localStorage["browser_action"]);
  chrome.browserAction.setTitle({ title: button.title });
  chrome.browserAction.setIcon({ path: button.icon });
  //TODO: create an option for always making the window fullscreen size
}
restoreOptions();

function browserActionHandler() {
  const action = actionFor(localStorage["browser_action"]);
  if (action === "tab_glue") {
    tabGlueAction();
  } else if (action === "tab_glue_all") {
    tabGlueAllAction();
  } else {
    start();
  }
}

chrome.browserAction.onClicked.addListener(browserActionHandler);
// Set up a handler so that we can merge all the windows.
chrome.commands.onCommand.addListener(function (command) {
  console.log("Command:", command);
  if (command === "tab_glue") {
    tabGlueAction();
  } else if (command === "tab_glue_all") {
    tabGlueAllAction();
  } else if (command === "tab_scissor_cut") {
    start();
  }
});
