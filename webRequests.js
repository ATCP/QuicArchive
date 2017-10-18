chrome.webRequest.onBeforeRequest.addListener(
    function(details) {
        //console.log('tabId:' + details.tabId);
    },
    {urls: ["<all_urls>"]}
);

