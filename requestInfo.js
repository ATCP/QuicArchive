
var requestInfo = {};
var resourceTime = {};

function createRequestInfo(debuggeeId, params) {
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

function updateRequestSent(params) {
    if (!requestInfo[params.requestId].requestTime)
        requestInfo[params.requestId].requestTime = params.timestamp;

    requestInfo[params.requestId].id = params.requestId;
    requestInfo[params.requestId].type = params.type;
    requestInfo[params.requestId].method = params.request.method;
    requestInfo[params.requestId].dup += 1;
    requestInfo[params.requestId].url = params.request.url;
    requestInfo[params.requestId].requestHeaders = params.request.headers;


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



}
