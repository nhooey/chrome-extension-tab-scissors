// Called when the user clicks on the browser action.
// noinspection JSUnresolvedVariable,JSUnresolvedFunction

let theTabs = null;
let selectedTabPosition = null;
let selectedTab = null;
let targetWindow = null;
let tabCount = 0;

function start() {
  chrome.windows.getCurrent(getWindows);
}

function getWindows(win) {
  targetWindow = win;
  chrome.tabs.getAllInWindow(targetWindow.id, getTabs);
}

function getTabs(tabs) {
  tabCount = tabs.length;
  theTabs = tabs;
  chrome.tabs.getSelected(targetWindow.id, setTab);
}

function setTab(theTab) {
  selectedTabPosition = splitIndex(theTabs, theTab.id);
  if (selectedTabPosition === null) {
    return;
  }
  selectedTab = theTabs[selectedTabPosition];
  const halves = splitLayout(targetWindow);
  chrome.windows.create({ tabId: selectedTab.id, ...halves.right }, moveTabs);
  chrome.windows.update(targetWindow.id, halves.left);
}

function moveTabs(newWindow) {
  const numTabs = theTabs.length;
  let tabPosition = 1;
  for (let j = selectedTabPosition + 1; j < numTabs; j++) {
    const tab = theTabs[j];
    // Move the tab into the new window.
    chrome.tabs.move(tab.id, { windowId: newWindow.id, index: tabPosition });
    tabPosition++;
  }

  chrome.tabs.update(selectedTab.id, { selected: true });
}
