
tabs = {};


chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {

    /* page back and forward or new page*/
    if (changeInfo.status == 'loading') {
        if (currentTabs[tabId]) {
            if (changeInfo.url) {
                console.log('tabs on back forward tab: ' + tabId + ' url ' + changeInfo.url + ' status ' + changeInfo.status);

                currentTabs[tabId].url = changeInfo.url;
                currentTabs[tabId].title = changeInfo.title;

                createPageOnUpdate(tab);

            } /* page reload */
            else if (changeInfo.url == undefined && tab.url.indexOf(currentTabs[tabId] > -1) /*&& changeInfo.status*/) {

                console.log('tabs on reload tab: ' + tabId + ' url ' + tab.url + ' status ' + changeInfo.status);

                createPageOnReload(tab);
            }

        }
        else if (!currentTabs[tabId]) {
            if (tab.url.substring(0, 5) == 'https' || tab.url.substring(0, 4) == 'http') {

                console.log('tabs.onCreated tab: ' + tab.id + ' title: ' + tab.title + ' index ' + tab.index + ' url ' + tab.url);

                currentTabs[tabId] = {
                    url: tab.url,
                    title: tab.title,
                    status: tab.status
                };

                chrome.debugger.attach({tabId: tabId}, version, null);
                chrome.debugger.sendCommand({tabId: tabId}, "Network.enable");
                chrome.debugger.sendCommand({tabId: tabId}, "Page.enable");
                chrome.debugger.sendCommand({tabId: tabId}, "DOM.enable");

                chrome.debugger.onEvent.addListener(onEvent);

                createPageOnBoot(tabId, tab.url);

            }

        }
    } else if (changeInfo.status == 'completed') {
        console.log('tab completed');
    }

});

chrome.tabs.onCreated.addListener(function (tab) {

    console.log('tabs.onCreated -- window: ' + tab.windowId + ' tab: ' + tab.id + ' title: ' + tab.title + ' index ' + tab.index + ' url ' + tab.url);

    if (tab.url.substring(0, 5) == 'https' || tab.url.substring(0, 4) == 'http') {

        currentTabs[tab.id] = {
            url: tab.url,
            title: tab.title,
            status: tab.status
        };

        chrome.debugger.attach({tabId: tab.id}, version, null);
        chrome.debugger.sendCommand({tabId: tab.id}, "Network.enable");
        chrome.debugger.sendCommand({tabId: tab.id}, "Page.enable");
        chrome.debugger.sendCommand({tabId: tab.id}, "DOM.enable");

        chrome.debugger.onEvent.addListener(onEvent);

        createPageOnBoot(tab.id, tab.url);
    }

});

chrome.tabs.onRemoved.addListener(function (tabId, props) {

});

