
tabs = {};


chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {

    /* page back and forward or new page*/
    if (changeInfo.status == 'loading') {
        if (currentTabs[tabId]) {

            if (changeInfo.url) {

                currentTabs[tabId].url = changeInfo.url;
                currentTabs[tabId].title = changeInfo.title;
                currentTabs[tabId].status = changeInfo.status;
                //createPageOnUpdate(tabId);

                console.log('tabs on back forward tab: ' + tab.url + ' url ' + changeInfo.url + ' status ' + changeInfo.status);

            } /* page reload */
            else if (changeInfo.url == undefined && tab.url.indexOf(currentTabs[tabId].url) > -1) {

                if (currentTabs[tabId].status == 'boot') {
                    currentTabs[tabId].status = 'loading';

                    createPageOnReload(tabId);
                }
                else if (currentTabs[tabId].status == 'domCompleted') {
                    currentTabs[tabId].status = 'loading';
                    //createPageOnReload(tabId);

                } else if (currentTabs[tabId].status == 'created') {

                }

                console.log('tabs on reload tab: ' + tabId + ' url ' + tab.url + ' status ' + changeInfo.status);

            }

        }
        else if (!currentTabs[tabId]) {

            if (tab.url.substring(0, 5) == 'https' || tab.url.substring(0, 4) == 'http') {

                chrome.debugger.attach({tabId: tabId}, version, null);
                chrome.debugger.sendCommand({tabId: tabId}, "Network.enable");
                chrome.debugger.sendCommand({tabId: tabId}, "Page.enable");
                chrome.debugger.sendCommand({tabId: tabId}, "DOM.enable");
                chrome.debugger.sendCommand({tabId: tabId}, "Network.setCacheDisabled", {cacheDisabled: true});

                chrome.debugger.onEvent.addListener(onEvent);

                currentTabs[tabId] = {
                    url: tab.url,
                    title: tab.title,
                    status: 'boot'
                };

                currentTabs[tabId].status = 'created';

                createPageOnBoot(tabId, tab.windowId + '-' + tabId);

                createPageOnReload(tabId);

                chrome.debugger.sendCommand({tabId: tabId}, "Page.reload", {ignoreCache: true});


                console.log('tabs.onCreated tab: ' + tab.id + ' title: ' + tab.title + ' index ' + tab.index + ' url ' + tab.url);

            }

        }
    } else if (changeInfo.status == 'completed') {

        console.log('tab completed');
    }

});

chrome.tabs.onCreated.addListener(function (tab) {


    if (tab.url.substring(0, 5) == 'https' || tab.url.substring(0, 4) == 'http') {

        chrome.debugger.attach({tabId: tab.id}, version, null);
        chrome.debugger.sendCommand({tabId: tab.id}, "Network.enable");
        chrome.debugger.sendCommand({tabId: tab.id}, "Page.enable");
        chrome.debugger.sendCommand({tabId: tab.id}, "DOM.enable");

        chrome.debugger.sendCommand({tabId: tab.id}, "Network.setCacheDisabled", {cacheDisabled: true});

        chrome.debugger.onEvent.addListener(onEvent);


        currentTabs[tab.id] = {
            url: tab.url,
            title: tab.title,
            status: 'boot'
        };

        currentTabs[tabId].status = 'created';

        createPageOnBoot(tabId, tab.windowId + '-' + tabId);

        createPageOnReload(tabId);

        chrome.debugger.sendCommand({tabId: tab.id}, "Page.reload", {ignoreCache: true});


    }

    console.log('tabs.onCreated -- window: ' + tab.windowId + ' tab: ' + tab.id + ' title: ' + tab.title + ' index ' + tab.index + ' url ' + tab.url);

});

chrome.tabs.onRemoved.addListener(function (tabId, props) {

    console.log('tabs.onRemoved -- window: ' + props.windowId + ' tab: ' + tabId);

     if (currentTabs[tabId]) {

         sendLogsToServer(tabId);
     }
});



