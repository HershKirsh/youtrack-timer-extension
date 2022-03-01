function openYouTrackTab(currentTab, youTrackURL) {
  const currentTabId = currentTab.id;
  chrome.tabs.create({'url': youTrackURL, 'index': currentTabId + 1}, function (tab) {
    setTimeout(function () {
      chrome.tabs.update(currentTabId, {active: true});
    }, 500);
  });
}

function focusYouTrackTab() {
  chrome.tabs.query({}, function (tabs) {
    const youTrackTab = tabs.filter(tab => tab.url.includes('.myjetbrains.com/youtrack/agiles'));
    if (youTrackTab[0]) {
      chrome.tabs.update(youTrackTab[0].id, {active: true});
    }
  });
}