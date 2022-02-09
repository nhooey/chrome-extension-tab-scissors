// Called when the user clicks on the browser action.
// noinspection JSUnresolvedVariable,JSUnresolvedFunction,JSUndeclaredVariable

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
  selectedTab = theTab;
  for (let k = 0; k < theTabs.length; k++) {
    if (theTabs[k].id === selectedTab.id) {
      selectedTabPosition = k;
      break;
    }
  }
  if (selectedTabPosition === 0) {
    selectedTabPosition = 1;
    if (theTabs.length < 2) {
      return;
    }
    selectedTab = theTabs[selectedTabPosition];
  }
  const halfWidth = Math.round(targetWindow.width / 2);
  //196 is chrome's minimum window width.
  windWidth = Math.max(196, halfWidth);
  windTop = targetWindow.top;
  windHeight = targetWindow.height;
  windLeft = targetWindow.left;
  rX = windLeft + windWidth;

  const windCreateRightObj = {
    "tabId": selectedTab.id,
    "left": rX,
    "top": windTop,
    "width": windWidth,
    "height": windHeight
  };
  const windResizeLeftObj = {"left": windLeft, "top": windTop, "width": windWidth, "height": windHeight};
  //const sum = windWidth + windTop + windHeight + windLeft + rX;
  chrome.windows.create(windCreateRightObj, moveTabs);
  chrome.windows.update(targetWindow.id, windResizeLeftObj);
}

function moveTabs(newWindow) {
  const numTabs = theTabs.length;
  let tabPosition = 1;
  for (let j = selectedTabPosition + 1; j < numTabs; j++) {
    const tab = theTabs[j];
    // Move the tab into the new window.
    chrome.tabs.move(tab.id, {"windowId": newWindow.id, "index": tabPosition});
    tabPosition++;
  }

  chrome.tabs.update(selectedTab.id, {"selected": true});
}

// Set up a click handler so that we can split the window.
//    chrome.browserAction.onClicked.addListener(start);
//	chrome.browserAction.setIcon({path:"icon10.png"});
