
var version = "1.2";
//tip-of-tree
var queryInfo = {
    currentWindow: true
};


var socket = new WebSocket('ws://127.0.0.1:1337');

var tabUrls = {};

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
            tabUrls[tabs[i].id] = url;
            chrome.debugger.attach({tabId: tabs[i].id}, version, null);
            chrome.debugger.sendCommand({tabId: tabs[i].id}, "Network.enable");
            chrome.debugger.sendCommand({tabId: tabs[i].id}, "Page.enable");
            chrome.debugger.sendCommand({tabId: tabs[i].id}, "DOM.enable");

            chrome.debugger.onEvent.addListener(onEvent);

            createExistPage(tabs[i].id, url);

        }
    }

}

socket.onopen = function (event) {
    console.log((new Date()) + " connected to server\n");
};

socket.onerror = function (event) {

};
socket.onmessage = function(message) {
    console.log(message);
};

socket.onclose = function(event) {

};

chrome.tabs.query(queryInfo, bootstrap);

var requests = {}; //div
var requestInfo = {};
var resourceTime = {};

function onEvent(debuggeeId, message, params) {

    if (message == "DOM.documentUpdated") {

    }
    else if (message == "Network.requestWillBeSent") {
        var requestDiv = requests[params.requestId];

        if (!requestDiv) {
            var requestDiv = document.createElement("div");
            requestDiv.className = "request-" + params.requestId;
            requests[params.requestId] = requestDiv;
            //var urlLine = document.createElement("div");
            //urlLine.textContent = params.request.url;
            //requestDiv.appendChild(urlLine);

            requestInfo[params.requestId] = {
                id: 0,
                tabId: debuggeeId.tabId,
                dup: 0,
                method: 0,
                url: 0,
                tabUrl: tabUrls[debuggeeId.tabId],
                totalDataLength: 0,
                totalEncodedDataLength: 0,
                type: 0,
                proto: 0,
                connId: 0,
                remoteIPAddr: 0,
                remotePort: 0,
                contentLen: 0,
                encodedDataBytesFinLoad: 0,
                requestTime: 0,
                responseTime: 0,
                loadingTime: 0,
                objLoadTime: 0,
                requestHeaders: 0,
                responseHeaders: 0
            };
            resourceTime[params.requestId] = {
                requestTime: 0,
                proxyStart: 0,
                proxyEnd: 0,
                dnsStart: 0,
                dnsEnd: 0,
                connectStart: 0,
                connectEnd: 0,
                sslStart: 0,
                sslEnd: 0,
                workerStart: 0,
                workerReady: 0,
                sendStart: 0,
                sendEnd: 0,
                pushStart: 0,
                pushEnd: 0,
                receiveHeadersEnd: 0
            };
        }

        if (params.redirectResponse) {
            var resp = document.createElement("div");
            resp.textContent = "redirect";
            requestDiv.appendChild(resp.textContent);
            appendResponse(params.requestId, params.redirectResponse);
        }

        var requestLine = document.createElement("div");
        requestLine.textContent = "\n" + params.request.method + ' ' + parseURL(params.request.url).host + ' ' + params.type;

        requestDiv.appendChild(requestLine);

        requestDiv.appendChild(formatHeaders(params.request.headers));
        document.getElementById("container").appendChild(requestDiv);
        console.log(debuggeeId.tabId + ' ' + params.requestId + ' Request will be sent' + '\n');
        updateRequestSent(params);

    }
    else if (message == "Network.responseReceived") {
        console.log(debuggeeId.tabId + ' ' + params.requestId + ' Response received: content length: ' + params.response.headers['content-length'] + '\n');

        appendResponse(params.requestId, params.response);

        updateResponseRcv(params);
    }
    else if (message == "Network.dataReceived") {
        if (requests[params.requestId]) {
            console.log(debuggeeId.tabId + ' ' + params.requestId + ' Data received: ' + params.dataLength + ' EncodedDataLength: ' + params.encodedDataLength + '\n');

            updateDataRcv(params);

        } else {
            console.error('request id not found!');
        }
    }
    else if (message == "Network.loadingFinished") {
        console.log(debuggeeId.tabId + ' ' + params.requestId + ' loadingFinished. total bytes received; ' + params.encodedDataLength + '\n');
        updateFinLoad(params);
    }
    else if (message == "Network.loadingFailed") {
        console.log(debuggeeId.tabId + ' ' + params.requestId + ' loadingFailed' + '\n');
    }
    else if (message == "Page.loadEventFired") {
        console.log('loadEvent: ' + params.timestamp);
    }
    else if (message == "Page.domContentEventFired") {
        console.log('domContent: ' + params.timestamp);
    }
}


function updateRequestSent(params) {
    if (!requestInfo[params.requestId].requestTime)
        requestInfo[params.requestId].requestTime = params.timestamp;

    requestInfo[params.requestId].id = params.requestId;
    requestInfo[params.requestId].type = params.type;
    requestInfo[params.requestId].method = params.request.method;
    requestInfo[params.requestId].dup += 1;
    requestInfo[params.requestId].url = params.request.url;
    requestInfo[params.requestId].requestHeaders = params.request.headers;

    if (!logs[requestInfo[params.requestId].tabId + requestInfo[params.requestId].tabUrl])
        createExistPage(params.requestId);

    updateEntryRequest(params.requestId);

    /*if (!logs[requestInfo[params.requestId].tabId + requestInfo[params.requestId].tabUrl].pages.startedDateTime) {
        updateHarDateTime(logs[requestInfo[params.requestId].tabId + requestInfo[params.requestId].tabUrl], params.timestamp);
    }*/
}

function updateResponseRcv(params) {
    requestInfo[params.requestId].responseTime = params.timestamp;

    requestInfo[params.requestId].proto = params.response.protocol;
    requestInfo[params.requestId].connId = params.response.connectionId;
    requestInfo[params.requestId].remoteIPAddr = params.response.remoteIPAddr;
    requestInfo[params.requestId].remotePort = params.response.remotePort;
    requestInfo[params.requestId].contentLen = parseInt(params.response.headers['content-length'], 10);
    requestInfo[params.requestId].totalEncodedDataLength += params.response.encodedDataLength;

    requestInfo[params.requestId].responseHeaders = params.response.headers;

    resourceTime[params.requestId].requestTime = params.response.timing.requestTime;
    resourceTime[params.requestId].proxyStart = params.response.timing.proxyStart;
    resourceTime[params.requestId].proxyEnd = params.response.timing.proxyEnd;
    resourceTime[params.requestId].dnsStart = params.response.timing.dnsStart;
    resourceTime[params.requestId].dnsEnd = params.response.timing.dnsEnd;
    resourceTime[params.requestId].connectStart = params.response.timing.connectStart;
    resourceTime[params.requestId].connectEnd = params.response.timing.connectEnd;
    resourceTime[params.requestId].sslStart = params.response.timing.sslStart;
    resourceTime[params.requestId].sslEnd = params.response.timing.sslEnd;
    resourceTime[params.requestId].workerStart = params.response.timing.workerStart;
    resourceTime[params.requestId].workerReady = params.response.timing.workerReady;
    resourceTime[params.requestId].sendStart = params.response.timing.sendStart;
    resourceTime[params.requestId].sendEnd = params.response.timing.sendEnd;
    resourceTime[params.requestId].pushStart = params.response.timing.pushStart;
    resourceTime[params.requestId].pushEnd = params.response.timing.pushEnd;
    resourceTime[params.requestId].receiveHeadersEnd = params.response.timing.receiveHeadersEnd;

    updateEntryResponse(params, params.requestId);
    //console.dir(resourceTime[params.requestId]);
}

function updateDataRcv(params) {
    var dataRev = document.createElement("div");
    dataRev.textContent = params.encodedDataLength;
    var requestDiv = requests[params.requestId];
    requestDiv.appendChild(dataRev);

    requestInfo[params.requestId].totalEncodedDataLength += params.encodedDataLength;
    requestInfo[params.requestId].totalDataLength += params.dataLength;

}

function updateFinLoad(params) {
    requestInfo[params.requestId].loadingTime = params.timestamp;
    requestInfo[params.requestId].encodedDataBytesFinLoad = params.encodedDataLength;
    requestInfo[params.requestId].dup -- ;

    var requestDiv = requests[params.requestId];
    var finLoad = document.createElement("div");
    finLoad.statusText = 'finish Load';
    requestDiv.appendChild(finLoad);
    requestDiv.appendChild(formatHeaders(requestInfo[params.requestId]));

    updateEntryLoad(params.requestId);

    if (requestInfo[params.requestId].dup <= 0) {

        //console.log(JSON.stringify(requestInfo[params.requestId], null, '\t'));
        socket.send(JSON.stringify(requestInfo[params.requestId]));
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

