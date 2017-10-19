'use strict'

if (!Date.prototype.toISOString) {
    Date.prototype.toISOString = function () {
        function pad(n) { return n < 10 ? '0' + n : n; }
        function ms(n) { return n < 10 ? '00'+ n : n < 100 ? '0' + n : n }
        return this.getFullYear() + '-' +
            pad(this.getMonth() + 1) + '-' +
            pad(this.getDate()) + 'T' +
            pad(this.getHours()) + ':' +
            pad(this.getMinutes()) + ':' +
            pad(this.getSeconds()) + '.' +
            ms(this.getMilliseconds()) + 'Z';
    }
}

var logs = {};
var entries = {};

function createExistTabHar(id, url) {
    logs[id + url] = {
        version: '1.2',
        creator: {
            name: "quicArchive",
            version: 1.0
        },
        pages: [{
            startedDateTime: (new Date()).toISOString(),
            id: url,
            title: url,
            pageTimings: {
                onConetentLoad: -1,
                onLoad: -1
            }
        }],
        entries: []
    };
}

function updateEntryRequest(requestId) {

    console.log(logs[requestInfo[requestId].tabId + requestInfo[requestId].tabUrl].pages.id);

    entries[requestId] = {
        pageref: logs[requestInfo[requestId].tabId + requestInfo[requestId].tabUrl].pages.id,
        startedDateTime: (new Date(requestInfo[requestId].requestTime)).toISOString(),
        time: 0,
        request: {
            method: requestInfo[requestId].method,
            url: requestInfo[requestId].url,
            httpVersion: "",
            cookies: [],
            headers: requestInfo[requestId].requestHeaders,
            queryString: [],
            headersSize: -1,
            bodySize: -1
        },
        response: {},
        cache: {},
        timings: {
            blocked: 0,
            dns: -1,
            connect: -1,
            send: 0,
            wait: 0,
            receive: 0,
            ssl: -1
        },
        serverIPAddress: "",
        connection: ""
    };
}

function updateEntryResponse(params) {
    var requestId = params.requestId;

    entries[requestId].request.httpVersion = requestInfo[requestId].proto;
    entries[requestId].response = {
        status: params.response.status,
        statusText: params.response.statusText,
        httpVersion: requestInfo[requestId].proto,
        cookies: [],
        headers: requestInfo[requestId].responseHeaders,
        redirectURL: "",
        headersSize: -1,
        bodySize: requestInfo[requestId].contentLen,
        content: {
            size: requestInfo[requestId].contentLen,
            mimeType: requestInfo[requestId].responseHeaders['content-type']
        }
    };
    entries[requestId].cache = {};
    entries[requestId].timings = {
        blocked: resourceTime[requestId].proxyEnd,
        dns: resourceTime[requestId].dnsEnd - resourceTime[requestId].dnsStart,
        connect: resourceTime[requestId].connectEnd - resourceTime[requestId].connectStart,
        send: resourceTime[requestId].sendEnd - resourceTime[requestId].sendStart,
        wait: resourceTime[requestId].receiveHeadersEnd - resourceTime[requestId].sendEnd,
        receive: 0,
        ssl: resourceTime[requestId].sslEnd - resourceTime[requestId].sslStart
    };

    entries[requestId].serverIPAddress = requestInfo[requestId].remoteIPAddr;
    entries[requestId].connection = requestInfo[requestId].connId;
}

function updateEntryLoad(requestId) {
    entries[requestId].time = requestInfo[requestId].loadingTime - requestInfo[requestId].requestTime;
    entries[requestId].timings.receive = requestInfo[requestId].loadingTime - requestInfo[requestId].responseTime;

    logs[requestInfo[requestId].tabId + requestInfo[requestId].tabUrl].entries.push(entries[requestId]);
    console.dir(logs[requestInfo[requestId].tabId + requestInfo[requestId].tabUrl]);
}

