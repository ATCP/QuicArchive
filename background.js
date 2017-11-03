
var version = "1.2";
//tip-of-tree
var queryInfo = {
    //currentWindow: true
};


var currentTabs = {};



function bootstrap(tabs) {


    console.log(tabs.length);

    var containers = document.createElement('div');
    containers.id = "container";
    document.body.appendChild(containers);

    for (var i = 0; i < tabs.length; i ++) {
        var url = tabs[i].url;
        console.log(url);
        console.assert(typeof url == 'string', 'tab.url should be a string');

        if (url.substring(0, 5) == 'https' || url.substring(0, 4) == 'http') {

            currentTabs[tabs[i].id] = {
                url: tabs[i].url,
                title: tabs[i].title,
                status: tabs[i].status
            };

            chrome.debugger.attach({tabId: tabs[i].id}, version, null);
            chrome.debugger.sendCommand({tabId: tabs[i].id}, "Network.enable");
            chrome.debugger.sendCommand({tabId: tabs[i].id}, "Page.enable");
            chrome.debugger.sendCommand({tabId: tabs[i].id}, "DOM.enable");
            chrome.debugger.sendCommand({tabId: tabs[i].id}, "Network.setCacheDisabled", {cacheDisabled: true});


            chrome.debugger.onEvent.addListener(onEvent);

            createPageOnBoot(tabs[i].id, url);

        }
    }

    connect();

}


chrome.tabs.query(queryInfo, bootstrap);

var requests = {}; //div


function onEvent(debuggeeId, message, params) {

    if (message == "Page.navigationRequested") {

        console.log('page navigated: ' + params.navigationId + ' ' + params.url + ' ' + params.isInMainFrame + ' ' + params.isRedirect);

    }
    else if (message == "DOM.documentUpdated") {
        console.log('dom document updated');

        if (currentTabs[debuggeeId.tabId].status == 'loading') {
            createPageOnReload(debuggeeId.tabId);

            console.log(debuggeeId.tabId + ' create page url ' + currentTabs[debuggeeId.tabId].url);

            currentTabs[debuggeeId.tabId].status = 'created';

        } else if (currentTabs[debuggeeId.tabId].status == 'domCompleted') {

        }

    }
    else if (message == "Network.requestWillBeSent") {

        var requestDiv = requests[params.requestId];

        if (!requestDiv ) {
            /*no chrome extension*/


            var requestDiv = document.createElement("div");
            requestDiv.className = "request-" + params.requestId;
            requests[params.requestId] = requestDiv;

            //var urlLine = document.createElement("div");
            //urlLine.textContent = params.request.url;
            //requestDiv.appendChild(urlLine);

            createRequestInfo(debuggeeId, params);

        }

        if (params.redirectResponse) {
            var redirectRes = document.createElement("div");
            redirectRes.textContent = "redirect";
            requestDiv.appendChild(redirectRes);
            appendResponse(params.requestId, params.redirectResponse);
        }

        var requestLine = document.createElement("div");
        requestLine.textContent = "\n" + params.request.method + ' ' + parseURL(params.request.url).host + ' ' + params.type;

        requestDiv.appendChild(requestLine);

        requestDiv.appendChild(formatHeaders(params.request.headers));
        document.getElementById("container").appendChild(requestDiv);

        //console.log(debuggeeId.tabId + ' ' + params.requestId + ' Request will be sent' + '\n');

        updateRequestSent(params);

        if (!requestInfo[params.requestId].url.indexOf('chrome-extension'))
            return;

        updateEntryRequest(params.requestId);

        //updatePageDateTime(params.requestId, params.timestamp);

    }
    else if (message == "Network.responseReceived") {

        var requestDiv = requests[params.requestId];

        /*
        if (!requestDiv ) {

            var requestDiv = document.createElement("div");
            requestDiv.className = "request-" + params.requestId;
            requests[params.requestId] = requestDiv;

            //var urlLine = document.createElement("div");
            //urlLine.textContent = params.request.url;
            //requestDiv.appendChild(urlLine);

            createRequestInfo(debuggeeId, params);

            requestInfo[params.requestId].requestTime = params.timestamp;

            requestInfo[params.requestId].type = params.type;
            requestInfo[params.requestId].id = params.requestId;

        }
        */

        if (!requestInfo[params.requestId]) {
            console.log('network responseReceived ' + params.requestId + ' is not found');

            return;
        }

        //console.log(debuggeeId.tabId + ' ' + params.requestId + ' Response received: content length: ' + params.response.headers['content-length'] + '\n');

        appendResponse(params.requestId, params.response);
        updateResponseRcv(params);

        if (!requestInfo[params.requestId].url || !requestInfo[params.requestId].url.indexOf('chrome-extension'))
            return;

        updateEntryResponse(params, params.requestId);
    }
    else if (message == "Network.dataReceived") {
        if (requests[params.requestId]) {
            //console.log(debuggeeId.tabId + ' ' + params.requestId + ' Data received: ' + params.dataLength + ' EncodedDataLength: ' + params.encodedDataLength + '\n');

            updateDataRcv(params);

        } else {
            //console.error('network dataReceived ' + params.requestId + ' is not found');
        }
    }
    else if (message == "Network.loadingFinished") {
        if (!requestInfo[params.requestId]) {
            console.log('network loadingFinished ' + params.requestId + ' is not found');
            return;
        }

        //console.log(debuggeeId.tabId + ' ' + params.requestId + ' loadingFinished. total bytes received; ' + params.encodedDataLength + '\n');

        updateFinLoad(params);

        updateEntryLoad(params.requestId);

        uploadHarLog(params.requestId);


    }
    else if (message == "Network.loadingFailed") {
        console.log(debuggeeId.tabId + ' ' + params.requestId + ' loadingFailed' + '\n');
    }
    else if (message == "Page.loadEventFired") {


        console.log(debuggeeId.tabId + ' loadEvent: ' + params.timestamp);

        updatePageLoadTime(debuggeeId.tabId, params.timestamp);
    }
    else if (message == "Page.domContentEventFired") {
        console.log(debuggeeId.tabId + ' domContent: ' + params.timestamp);

        updatePageDomLoadTime(debuggeeId.tabId, params.timestamp);

        currentTabs[debuggeeId.tabId].status = 'domCompleted';

    }
}


function appendResponse(requestId, response) {
    var requestDiv = requests[requestId];
    //requestDiv.appendChild(formatHeaders(response.requestHeaders));
    var statusLine = document.createElement("div");

    statusLine.textContent = "\n" + response.protocol + ' ' + response.status + ' ' + response.statusText + ' ' + response.encodedDataLength.toString() + ' ' + response.connectionId.toString() + '\n';

    requestDiv.appendChild(statusLine);
    requestDiv.appendChild(formatHeaders(response.headers));

}

function formatHeaders(headers) {
    var text = "";
    for (name in headers)
        text += name + ": " + headers[name] + "\n";
    var div = document.createElement("div");
    div.textContent = text;
    return div;
}

function parseURL(url) {
    var result = {};
    var match = url.match(
        /^([^:]+):\/\/([^\/:]*)(?::([\d]+))?(?:(\/[^#]*)(?:#(.*))?)?$/i);
    if (!match)
        return result;
    result.scheme = match[1].toLowerCase();
    result.host = match[2];
    result.port = match[3];
    result.path = match[4] || "/";
    result.fragment = match[5];
    return result;
}

