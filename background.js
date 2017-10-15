
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
            chrome.debugger.onEvent.addListener(onEvent);
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

    if (message == "Network.requestWillBeSent") {
        var requestDiv = requests[params.requestId];

        if (!requestDiv) {
            var requestDiv = document.createElement("div");
            requestDiv.className = "request";
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
                requestTime: [],
                responseTime: [],
                loadingTime: [],
                objLoadTime: []
            };

            resourceTime[params.requestId] = {
                requestTime: [],
                proxyStart: [],
                proxyEnd: [],
                dnsStart: [],
                dnsEnd: [],
                connectStart: [],
                connectEnd: [],
                sslStart: [],
                sslEnd: [],
                workerStart: [],
                workerReady: [],
                sendStart: [],
                sendEnd: [],
                pushStart: [],
                pushEnd: [],
                receiveHeadersEnd: []
            };
        }

        if (params.redirectResponse) {
            var resp = document.createElement("div");
            resp.textContent = "redirectResponse";
            requestDiv.appendChild(resp.textContent);
            appendResponse(params.requestId, params.redirectResponse);
        }

        var requestLine = document.createElement("div");
        requestLine.textContent = "\n" + params.request.method + ' ' + parseURL(params.request.url).host + ' ' + params.type;

        requestDiv.appendChild(requestLine);
        requestDiv.appendChild(formatHeaders(params.request.headers));
        document.getElementById("container").appendChild(requestDiv);

        console.log(debuggeeId.tabId + ' ' + params.requestId + ' ---Request will be sent\n');

        updateRequestSent(params);

    }
    else if (message == "Network.responseReceived") {
        console.log(debuggeeId.tabId + ' ' + params.requestId + ' ---Response received: content length: ' + params.response.headers['content-length'] + ' ' + params.type);
        appendResponse(params.requestId, params.response);
        updateResponseRcv(params);
    }
    else if (message == "Network.dataReceived") {
        if (requests[params.requestId]) {
            console.log(debuggeeId.tabId + ' ' + params.requestId + ' ---Data received: ' + params.dataLength + ' ---EncodedDataLength: ' + params.encodedDataLength + '\n');
            updateDataRcv(params);
        } else {
            console.error('request id not found!');
        }
    }
    else if (message == "Network.loadingFinished") {
        console.log(debuggeeId.tabId + ' ' + params.requestId + ' ---loadingFinished. total bytes received; ' + params.encodedDataLength + '\n');
        updateFinLoad(params);
    }
    else if (message == "Network.loadingFailed") {
        console.log(debuggeeId.tabId + ' ' + params.requestId + ' ---loadingFailed\n');
    }
}


function updateRequestSent(params) {
    requestInfo[params.requestId].requestTime.push(params.timestamp);
    requestInfo[params.requestId].id = params.requestId;
    requestInfo[params.requestId].type = params.type;
    requestInfo[params.requestId].method = params.request.method;
    requestInfo[params.requestId].dup += 1;
    requestInfo[params.requestId].url = parseURL(params.request.url).origin;
}

function updateResponseRcv(params) {
    requestInfo[params.requestId].responseTime.push(params.timestamp);
    requestInfo[params.requestId].proto = params.response.protocol;
    requestInfo[params.requestId].connId = params.response.connectionId;
    requestInfo[params.requestId].remoteIPAddr = params.response.remoteIPAddr;
    requestInfo[params.requestId].remotePort = params.response.remotePort;
    requestInfo[params.requestId].contentLen += parseInt(params.response.headers['content-length'], 10);
    requestInfo[params.requestId].totalEncodedDataLength += params.response.encodedDataLength;

    resourceTime[params.requestId].requestTime.push(params.response.timing.requestTime);
    resourceTime[params.requestId].proxyStart.push(params.response.timing.proxyStart);
    resourceTime[params.requestId].proxyEnd.push(params.response.timing.proxyEnd);
    resourceTime[params.requestId].dnsStart.push(params.response.timing.dnsStart);
    resourceTime[params.requestId].dnsEnd.push(params.response.timing.dnsEnd);
    resourceTime[params.requestId].connectStart.push(params.response.timing.connectStart);
    resourceTime[params.requestId].connectEnd.push(params.response.timing.connectEnd);
    resourceTime[params.requestId].sslStart.push(params.response.timing.sslStart);
    resourceTime[params.requestId].sslEnd.push(params.response.timing.sslEnd);
    resourceTime[params.requestId].workerStart.push(params.response.timing.workerStart);
    resourceTime[params.requestId].workerReady.push(params.response.timing.workerReady);
    resourceTime[params.requestId].sendStart.push(params.response.timing.sendStart);
    resourceTime[params.requestId].sendEnd.push(params.response.timing.sendEnd);
    resourceTime[params.requestId].pushStart.push(params.response.timing.pushStart);
    resourceTime[params.requestId].pushEnd.push(params.response.timing.pushEnd);
    resourceTime[params.requestId].receiveHeadersEnd.push(params.response.timing.receiveHeadersEnd);

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
    requestInfo[params.requestId].loadingTime.push(params.timestamp);
    requestInfo[params.requestId].encodedDataBytesFinLoad = params.encodedDataLength;

    var requestDiv = requests[params.requestId];
    requestDiv.appendChild(formatHeaders(requestDiv[params.requestId]));
    console.dir(requestInfo[params.requestId]);
    requestInfo[params.requestId].dup -- ;

    if (requestInfo[params.requestId].dup <= 0) {
        console.log('send request info\n');
        console.log(JSON.stringify(requestInfo[params.requestId], null, '\t'));
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

