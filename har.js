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


function createPageOnBoot(id, url) {
    logs[id] = {
        version: '1.2',
        creator: {
            name: "quicArchive",
            version: 1.0
        },
        pages: [{
            startedDateTime: null,
            id: 'page_' + 0,
            title: url,
            pageTimings: {
                onContentLoad: -1,
                onLoad: -1
            }
        }],
        entries: []
    };


}

function createPageOnUpdate(tab) {

    var pageLen = logs[tab.id].pages.length;

    logs[tab.id].pages.push(
        {
            startedDateTime: null,
            id: 'page_' + pageLen,
            title: tab.url,
            pageTimings: {
                onContentLoad: -1,
                onLoad: -1
            }
        }
    );

}

function createPageOnReload(tab) {

    var pageLen = logs[tab.id].pages.length;

    logs[tab.id].pages.push(
        {
            startedDateTime: null,
            id: 'page_' + pageLen,
            title: tab.url,
            pageTimings: {
                onContentLoad: -1,
                onLoad: -1
            }
        }
    );

}

function updateEntryRequest(requestId) {

    var pageLen = logs[requestInfo[requestId].tabId].pages.length;
    var page = logs[requestInfo[requestId].tabId].pages[pageLen-1];

    if (!entries[requestId]) {

        var entry = {
            pageref: page.id,
            startedDateTime: (new Date(requestInfo[requestId].requestTime)).toISOString(),
            time: 0,
            request: {
                method: requestInfo[requestId].method,
                url: requestInfo[requestId].url,
                httpVersion: "",
                cookies: requestInfo[requestId].responseHeaders['cookie'],
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

        if (entry.request.method == 'POST') {
            entry.request.bodySize = requestInfo[requestId].responseHeaders['content-length'];
        }


        logs[requestInfo[requestId].tabId].entries.push(entry);
        var len = logs[requestInfo[requestId].tabId].entries.length;
        entries[requestId] = len;

    } else {
        var idx = entries[requestId] - 1;
        var entry = logs[requestInfo[requestId].tabId].entries[idx];

        entry.pageref = page.id;
        entry.startedDateTime = (new Date(requestInfo[requestId].requestTime)).toISOString();
        entry.request.method = requestInfo[requestId].method;
        entry.request.url = requestInfo[requestId].url;
        entry.request.headers = requestInfo[requestId].requestHeaders;

    }
}

function updateEntryResponse(params, requestId) {


    if (entries[requestId]) {

        var idx = entries[requestId] - 1;
        var entry = logs[requestInfo[requestId].tabId].entries[idx];

        entry.request.httpVersion = requestInfo[requestId].proto;
        entry.request.headers = requestInfo[requestId].requestHeaders;
        try {
            entry.request.cookies = requestInfo[requestId].requestHeaders['cookie'];
        } catch (e) {
            console.log('request id ' + requestId + 'entry id ' + idx);
        }

        if (entry.request.method == 'POST') {
            entry.request.bodySize = requestInfo[requestId].requestHeaders['content-length'];
        }

        entry.response = {
            status: params.response.status,
            statusText: params.response.statusText,
            httpVersion: requestInfo[requestId].proto,
            cookies: requestInfo[requestId].responseHeaders['set-cookie'],
            headers: requestInfo[requestId].responseHeaders,
            redirectURL: requestInfo[requestId].responseHeaders['redirect'],
            headersSize: params.response.encodedDataLength,
            bodySize: requestInfo[requestId].contentLen,
            content: {
                size: requestInfo[requestId].contentLen,
                mimeType: requestInfo[requestId].responseHeaders['content-type']
            }
        };

        if (entry.response.status == '304')
            entry.response.bodySize = 0;

        entry.cache = {};
        entry.timings = {
            blocked: resourceTime[requestId].proxyEnd,
            dns: resourceTime[requestId].dnsEnd - resourceTime[requestId].dnsStart,
            connect: resourceTime[requestId].connectEnd - resourceTime[requestId].connectStart,
            send: resourceTime[requestId].sendEnd - resourceTime[requestId].sendStart,
            wait: resourceTime[requestId].receiveHeadersEnd - resourceTime[requestId].sendEnd,
            receive: 0,
            ssl: resourceTime[requestId].sslEnd - resourceTime[requestId].sslStart
        };

        entry.serverIPAddress = requestInfo[requestId].remoteIPAddr;
        entry.connection = requestInfo[requestId].connId;

    }

}

function updateEntryLoad(requestId) {
    if (entries[requestId]) {

        var idx = entries[requestId] - 1;
        var entry = logs[requestInfo[requestId].tabId].entries[idx];

        entry.time = requestInfo[requestId].loadingTime * 1000 - requestInfo[requestId].requestTime * 1000;
        entry.timings.receive = requestInfo[requestId].loadingTime * 1000 - requestInfo[requestId].responseTime * 1000;

        console.dir(logs[requestInfo[requestId].tabId]);
    } else {

    }
}

function updatePageDateTime(requestId, timestamp) {
    var pageLen = logs[requestInfo[requestId].tabId].pages.length;

    var page = logs[requestInfo[requestId].tabId].pages[pageLen-1];

    page.startedDateTime = (new Date(timestamp)).toISOString();

}

function updatePageLoadTime(tabId, timestamp) {
    var pageLen = logs[tabId].pages.length;

    var page = logs[tabId].pages[pageLen-1];

    page.pageTimings.onLoad = timestamp;
}

function updatePageDomLoadTime(tabId, timestamp) {
    var pageLen = logs[tabId].pages.length;

    var page = logs[tabId].pages[pageLen-1];

    page.pageTimings.onContentLoad = timestamp;
}

