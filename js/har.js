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

function stringToArr (str) {
    return str.split(",");
}

function objToArr (obj) {
    var result = [];

    var key;
    for (key in obj) {
        result.push({
            name: key,
            value: obj[key],
            comment: ''
        });
    }

    return result;

}

function toLowerCase(obj) {
    var key, keys = Object.keys(obj);
    var n = keys.length;
    var newobj={};
    while (n--) {
        key = keys[n];
        newobj[key.toLowerCase()] = obj[key];
    }
    return newobj;
}

var logs = {};
var entries = {};
var pages = {};

function createPageOnBoot(id, name) {
    logs[id] =
    {
        log: {
            version: '1.2',
            creator: {
                name: name.toString(),
                version: "1.0"
            },
            pages: [/*{
                startedDateTime: null,
                id: 'page_' + 0,
                title: url,
                pageTimings: {
                    onContentLoad: -1,
                    onLoad: -1
                },
                _startTime: 0
            }*/],
            entries: []
        }
    };


}


function getGeolocation(tabId) {
    var pageLen = logs[tabId].log.pages.length;
    var page = logs[tabId].log.pages[pageLen - 1];

    if (!page)
        return;

    var geoLocate = new GeoLocation();
    geoLocate.fetch({
        success: function () {
            setBadgeText(geoLocate.get('country_code') ? geoLocate.get('country_code') : 'ERR');
            page._geolocation.ip = geoLocate.get('ip');

            page._geolocation.country = geoLocate.get('country_name');
            page._geolocation.city = geoLocate.get('city');

        },
        error: function () {
            setBadgeText('ERR');
        },
        timeout: 2800
    });


}

function initLoadedPages(tabId) {

    logs[tabId].log.pages.push(
        {
            startedDateTime: 0,
            id: 'page_' + 0,
            title: currentTabs[tabId].url,
            pageTimings: {
                onContentLoad: -1,
                onLoad: -1
            },

            _startTime: 0,
            _entries: 0,
            _tabs: 0,
            _mem: 0,
            _closeDateTime: 0,
            _geolocation: {
                ip: null,
                country: null,
                city: null
            }

        }
    );

    chrome.tabs.query({}, function(tabs) {
        logs[tabId].log.pages[0]._tabs = tabs.length;
    });

    getGeolocation(tabId);

}



function createPageOnUpdate(tabId) {

    var pageLen = logs[tabId].log.pages.length;

    logs[tabId].log.pages.push(
        {
            startedDateTime: 0,
            id: 'page_' + pageLen,
            title: currentTabs[tabId].url,
            pageTimings: {
                onContentLoad: -1,
                onLoad: -1
            },

            _startTime: 0,
            _entries: 0,
            _tabs: 0,
            _mem: 0,
            _closeDateTime: 0,
            _geolocation: {
                ip: null,
                country: null,
                city: null
            }

        }
    );

    var idx = pageLen;
    chrome.tabs.query({}, function(tabs) {
        logs[tabId].log.pages[idx]._tabs = tabs.length;
    });

    getGeolocation(tabId);

}

function createPageOnReload(tabId) {


    var pageLen = logs[tabId].log.pages.length;

    logs[tabId].log.pages.push(
        {
            startedDateTime: 0,
            id: 'page_' + pageLen,
            title: currentTabs[tabId].url,
            pageTimings: {
                onContentLoad: -1,
                onLoad: -1
            },
            _startTime: 0,
            _entries: 0,
            _tabs: tabs,
            _mem: 0,
            _closeDateTime: 0,
            _geolocation: {
                ip: null,
                country: null,
                city: null
            }
        }
    );

    var idx = pageLen;

    chrome.tabs.query({}, function(tabs) {
        logs[tabId].log.pages[idx]._tabs = tabs.length;
    });

    getGeolocation(tabId);
}

function updateEntryRequest(requestId) {

    var pageLen = logs[requestInfo[requestId].tabId].log.pages.length;
    var page = logs[requestInfo[requestId].tabId].log.pages[pageLen - 1];

    if (!page)
        return;


    if (!entries[requestId]) {

        var entry = {
            pageref: page.id,
            startedDateTime: (new Date()).toISOString(),
            time: 0,
            request: {
                method: requestInfo[requestId].method,
                url: requestInfo[requestId].url,
                httpVersion: "",
                cookies: [],
                headers: [],
                queryString: [],
                headersSize: -1,
                bodySize: -1
            },
            response: {
                status: -1,
                statusText: '',
                httpVersion: '',
                cookies: [],
                headers: [],
                redirectURL: '',
                headersSize: -1,
                bodySize: -1,
                content: {
                    size: -1,
                    mimeType: ''
                },
                _transferSize: 0
            },
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
            serverIPAddress: '',
            connection: '',
            _id: requestId,
            _failReason: 'timeout',
            _startTIme: requestInfo[requestId].requestTime
        };


        logs[requestInfo[requestId].tabId].log.entries.push(entry);

        if (page.pageTimings.onLoad == -1)
            page._entries ++;

        var len = logs[requestInfo[requestId].tabId].log.entries.length;

        entries[requestId] = len;

    } else {

        var idx = entries[requestId] - 1;
        var entry = logs[requestInfo[requestId].tabId].log.entries[idx];

        entry.pageref = page.id;
        //entry.startedDateTime = (new Date(requestInfo[requestId].requestTime)).toISOString();
        entry.request.method = requestInfo[requestId].method;
        entry.request.url = requestInfo[requestId].url;

    }

    if (!page.startedDateTime) { // for the first entry of this page, it must have the same url as the page

        if (page.title.indexOf(entry.request.url) != 0) {

            var idx = entries[requestId] - 1;
            var found = false;
            while (idx --) {
                var entry = logs[requestInfo[requestId].tabId].log.entries[idx];
                if (page.title.indexOf(entry.request.url) == 0) {
                    page.startedDateTime = entry.startedDateTime;
                    page._startTime = entry._startTIme;
                    entry.pageref = page.id;

                    console.log(entry.pageref + ' ' + page.title + ' ' + entry.request.url);

                    while ((idx ++) < entries[requestId] - 1) {
                        entry = logs[requestInfo[requestId].tabId].log.entries[idx];
                        entry.pageref = page.id;
                    }
                    found = true;

                    break;

                }
            }

            if (!found) {
                page.startedDateTime = entry.startedDateTime;
                page._startTime = requestInfo[requestId].requestTime;
            }
        }
        else {
            page.startedDateTime = entry.startedDateTime;
            page._startTime = requestInfo[requestId].requestTime;

            if (entry.pageref != page.id)
                entry.pageref = page.id
        }

        if (pageLen > 1)
            logs[requestInfo[requestId].tabId].log.pages[pageLen-2]._closeDateTime = page.startedDateTime;
    }
    else {
        if (page._startTime > requestInfo[requestId].requestTime) {
            page.startedDateTime = entry.startedDateTime;
            page._startTime = requestInfo[requestId].requestTime;
        }
    }

}

function updateEntryResponse(params, requestId) {


    var pageLen = logs[requestInfo[requestId].tabId].log.pages.length;
    var page = logs[requestInfo[requestId].tabId].log.pages[pageLen - 1];

    if (!page)
        return;

    if (entries[requestId]) {

        var idx = entries[requestId] - 1;
        var entry = logs[requestInfo[requestId].tabId].log.entries[idx];

        entry.request.httpVersion = requestInfo[requestId].proto;


        if (requestInfo[requestId].requestHeaders) {

            requestInfo[requestId].requestHeaders = toLowerCase(requestInfo[requestId].requestHeaders);

            entry.request.headers = objToArr(requestInfo[requestId].requestHeaders);

            if (requestInfo[requestId].requestHeaders['cookie']) {
                entry.request.cookies = stringToArr(requestInfo[requestId].requestHeaders['cookie']);
            }

            if (entry.request.method == 'POST' && requestInfo[requestId].requestHeaders['content-length']) {

                entry.request.bodySize = requestInfo[requestId].requestHeaders['content-length'];
            }
        }

        entry.response.status = params.response.status;
        entry.response.statusText = params.response.statusText;
        entry.response.httpVersion = requestInfo[requestId].proto;


        if (params.response.encodedDataLength)
            entry.response.headersSize = params.response.encodedDataLength;


        if (requestInfo[requestId].responseHeaders) {

            requestInfo[requestId].responseHeaders = toLowerCase(requestInfo[requestId].responseHeaders);

            entry.response.headers = objToArr(requestInfo[requestId].responseHeaders);

            if (requestInfo[requestId].responseHeaders['set-cookie']) {
                entry.response.cookies = stringToArr(requestInfo[requestId].responseHeaders['set-cookie']);
            }

            requestInfo[params.requestId].contentLen = Number(requestInfo[requestId].responseHeaders['content-length']);

            if (requestInfo[requestId].contentLen) {
                entry.response.bodySize = requestInfo[requestId].contentLen;
                entry.response.content.size = requestInfo[requestId].contentLen;
            }

            if (requestInfo[requestId].responseHeaders['content-type'])
                entry.response.content.mimeType = requestInfo[requestId].responseHeaders['content-type'];
            else if (requestInfo[requestId].type)
                entry.response.content.mimeType = requestInfo[requestId].type;

        }

        if (entry.response.status == '304')
            entry.response.bodySize = 0;

        entry.cache = {};
        entry.timings = {
            blocked: resourceTime[requestId].proxyEnd < 0 ? 0:resourceTime[requestId].proxyEnd,
            dns: resourceTime[requestId].dnsEnd - resourceTime[requestId].dnsStart,
            connect: resourceTime[requestId].connectEnd - resourceTime[requestId].connectStart,
            send: resourceTime[requestId].sendEnd - resourceTime[requestId].sendStart,
            wait: resourceTime[requestId].receiveHeadersEnd - resourceTime[requestId].sendEnd,
            receive: 0,
            ssl: resourceTime[requestId].sslEnd - resourceTime[requestId].sslStart
        };

        if (requestInfo[requestId].remoteIPAddr)
            entry.serverIPAddress = requestInfo[requestId].remoteIPAddr;

        entry.connection = requestInfo[requestId].connId.toString();

    } else {

        var entry = {
            pageref: page.id,
            startedDateTime: (new Date()).toISOString(),
            time: 0,
            request: {
                method: 'GET',
                url: '',
                httpVersion: '',
                cookies: [],
                headers: [],
                queryString: [],
                headersSize: -1,
                bodySize: -1
            },
            response: {
                status: params.response.status,
                statusText: params.response.statusText,
                httpVersion: requestInfo[requestId].proto,
                cookies: [],
                headers: [],
                redirectURL: '',
                headersSize: -1,
                bodySize: -1,
                content: {
                    size: -1,
                    mimeType: ''
                },
                _transferSize: 0
            },
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
            serverIPAddress: '',
            connection: '',
            _id: requestId,
            _failReason: 'timeout',
            _startTime: requestInfo[requestId].requestTime
        };

        entry.request.httpVersion = requestInfo[requestId].proto;
        entry.request.url = params.response.url;


        if (requestInfo[params.requestId].requestHeaders) {

            requestInfo[requestId].requestHeaders = toLowerCase(requestInfo[requestId].requestHeaders);

            entry.request.headers = objToArr(requestInfo[requestId].requestHeaders);


            if (requestInfo[requestId].requestHeaders['cookie']) {
                entry.request.cookies = stringToArr(requestInfo[requestId].requestHeaders['cookie']);
            }

            if (requestInfo[requestId].requestHeaders['method']) {
                entry.request.method = requestInfo[requestId].requestHeaders['method'];
            }

            if (entry.request.method == 'POST' && requestInfo[requestId].requestHeaders['content-length']) {
                entry.request.bodySize = requestInfo[requestId].requestheaders['content-length'];
            }
        }

        if (params.response.encodedDataLength)
            entry.response.headersSize = params.response.encodedDataLength;

        if (requestInfo[requestId].responseHeaders) {

            requestInfo[requestId].responseHeaders = toLowerCase(requestInfo[requestId].responseHeaders);

            entry.response.headers = objToArr(requestInfo[requestId].responseHeaders);

            if (requestInfo[requestId].responseHeaders['set-cookie']) {
                entry.response.cookies = stringToArr(requestInfo[requestId].responseHeaders['set-cookie']);
            }

            requestInfo[params.requestId].contentLen = Number(requestInfo[requestId].responseHeaders['content-length']);

            if (requestInfo[requestId].contentLen) {
                entry.response.bodySize = requestInfo[requestId].contentLen;
                entry.response.content.size = requestInfo[requestId].contentLen;
            }

            if (requestInfo[requestId].responseHeaders['content-type'])
                entry.response.content.mimeType = requestInfo[requestId].responseHeaders['content-type'];
            else if (requestInfo[requestId].type) {
                entry.response.content.mimeType = requestInfo[requestId].type;

            }
        }

        if (entry.response.status == '304')
            entry.response.bodySize = 0;

        entry.cache = {};
        entry.timings = {
            blocked: resourceTime[requestId].proxyEnd < 0 ? 0:resourceTime[requestId].proxyEnd,
            dns: resourceTime[requestId].dnsEnd - resourceTime[requestId].dnsStart,
            connect: resourceTime[requestId].connectEnd - resourceTime[requestId].connectStart,
            send: resourceTime[requestId].sendEnd - resourceTime[requestId].sendStart,
            wait: resourceTime[requestId].receiveHeadersEnd - resourceTime[requestId].sendEnd,
            receive: 0,
            ssl: resourceTime[requestId].sslEnd - resourceTime[requestId].sslStart
        };

        if (requestInfo[requestId].remoteIPAddr)
            entry.serverIPAddress = requestInfo[requestId].remoteIPAddr;

        entry.connection = requestInfo[requestId].connId.toString();

        logs[requestInfo[requestId].tabId].log.entries.push(entry);

        if (page.pageTimings.onLoad == -1)
            page._entries ++;

        var len = logs[requestInfo[requestId].tabId].log.entries.length;
        entries[requestId] = len;

    }

    if (!page.startedDateTime) { // for the first entry of this page, it must have the same url as the page
        if (page.title.indexOf(requestInfo[requestId].url) == 0) {

            page.startedDateTime = entry.startedDateTime;
            page._startTime = resourceTime[requestId].requestTime ? resourceTime[requestId].requestTime : requestInfo[requestId].requestTime;

            if (entry.pageref != page.id)
                entry.pageref = page.id
        }
        else {
            page.startedDateTime = entry.startedDateTime;
            page._startTime = resourceTime[requestId].requestTime ? resourceTime[requestId].requestTime : requestInfo[requestId].requestTime;
        }

        if (pageLen > 1)
            logs[tabId].log.pages[pageLen-2]._closeDateTime = page.startedDateTime;
    }
    else {
        if (page._startTime > (resourceTime[requestId].requestTime ? resourceTime[requestId].requestTime : requestInfo[requestId].requestTime)) {
            page.startedDateTime = entry.startedDateTime;
            page._startTime = resourceTime[requestId].requestTime ? resourceTime[requestId].requestTime : requestInfo[requestId].requestTime;
        }

    }


}

function updateEntryLoad(requestId) {
    if (entries[requestId]) {

        var idx = entries[requestId] - 1;
        var entry = logs[requestInfo[requestId].tabId].log.entries[idx];

        entry._failReason = 'successful';

        if (resourceTime[requestId].requestTime && resourceTime[requestId].requestTime < requestInfo[requestId].requestTime) {
            entry.time = requestInfo[requestId].loadingTime * 1000 - resourceTime[requestId].requestTime * 1000;
            entry.timings.receive = requestInfo[requestId].loadingTime * 1000 - (resourceTime[requestId].receiveHeadersEnd + resourceTime[requestId].requestTime * 1000);

        } else {
            entry.time = requestInfo[requestId].loadingTime * 1000 - requestInfo[requestId].requestTime * 1000;
            entry.timings.receive = requestInfo[requestId].loadingTime * 1000 - (resourceTime[requestId].receiveHeadersEnd + requestInfo[requestId].requestTime * 1000);
        }

        if (requestInfo[requestId].encodedDataBytesFinLoad) {
            entry.response._transferSize = requestInfo[requestId].encodedDataBytesFinLoad;
        }
        else
            entry.response._transferSize = 0;

        if (requestInfo[requestId].totalDataLength) {
            entry.response.content.size = parseInt(requestInfo[requestId].totalDataLength/requestInfo[requestId].noReq, 10);
            entry.response.bodySize = entry.response.content.size;

        } else {
            entry.response.content.size = entry.response.bodySize = 0;

        }

        var pageLen = logs[requestInfo[requestId].tabId].log.pages.length;
        var page = logs[requestInfo[requestId].tabId].log.pages[pageLen - 1];

        if (!page.startedDateTime) { // for the first entry of this page, it must have the same url as the page
            if (page.title.indexOf(requestInfo[requestId].url) == 0) {

                page.startedDateTime = entry.startedDateTime;
                page._startTime = resourceTime[requestId].requestTime ? resourceTime[requestId].requestTime : requestInfo[requestId].requestTime;

                if (entry.pageref != page.id)
                    entry.pageref = page.id
            }
            else
            {
                page.startedDateTime = entry.startedDateTime;
                page._startTime = resourceTime[requestId].requestTime ? resourceTime[requestId].requestTime : requestInfo[requestId].requestTime;
            }
        }
        else {
            if (page._startTime > (resourceTime[requestId].requestTime ? resourceTime[requestId].requestTime : requestInfo[requestId].requestTime)) {
                page.startedDateTime = entry.startedDateTime;
                page._startTime = resourceTime[requestId].requestTime ? resourceTime[requestId].requestTime : requestInfo[requestId].requestTime;
            }
        }
    }
}



function updatePageLoadTime(tabId, timestamp) {
    var pageLen = logs[tabId].log.pages.length;
    var page = logs[tabId].log.pages[pageLen-1];

    if (!page)
        return;

    page.pageTimings.onLoad = (timestamp - page._startTime) * 1000;
}

function updatePageDomLoadTime(tabId, timestamp) {
    var pageLen = logs[tabId].log.pages.length;
    var page = logs[tabId].log.pages[pageLen-1];

    if (!page)
        return;

    page.pageTimings.onContentLoad = (timestamp - page._startTime) * 1000;
}

function updateHarFailReason(params) {
    if (entries[params.requestId]) {
        var idx = entries[params.requestId] - 1;
        var entry = logs[requestInfo[params.requestId].tabId].log.entries[idx];

        entry._failReason = 'failed-';

        if (requestInfo[params.requestId].totalDataLength) {
            entry.response.content.size = parseInt(requestInfo[params.requestId].totalDataLength/requestInfo[params.requestId].noReq, 10);
            entry.response.bodySize = entry.response.content.size;
        }
        else {
            entry.response.content.size = 0;
            entry.response.bodySize = 0;
        }


        if (requestInfo[params.requestId].failTime) {
            entry.time = requestInfo[params.requestId].failTime * 1000 - requestInfo[params.requestId].requestTime * 1000;

            entry.timings.receive = requestInfo[params.requestId].failTime * 1000 - (resourceTime[params.requestId].receiveHeadersEnd + requestInfo[params.requestId].requestTime * 1000);
        }

        if (params.errorText) {
            entry._failReason += params.errorText;
            console.log('failed reason: ' + idx + ' ' + params.requestId + ' ' + params.errorText);
        }
        if (params.canceled) {
            entry._failReason += params.canceled;
            console.log('is canceled by users ' + idx);
        }
        if (params.blockedReason) {
            entry._failReason += params.canceled;
            console.log(params.blockedReason + '  '+ idx);
        }
    }
}

function updateHarDataRcv(params) {
    if (entries[params.requestId]) {
        var idx = entries[params.requestId] - 1;
        var entry = logs[requestInfo[params.requestId].tabId].log.entries[idx];

        if (requestInfo[params.requestId].totalDataLength) {
            entry.response.content.size = parseInt(requestInfo[params.requestId].totalDataLength/requestInfo[params.requestId].noReq, 10);
            entry.response.bodySize = entry.response.content.size;
        }
        else {
            entry.response.content.size = 0;
            entry.response.bodySize = 0;
        }

        if (params.timestamp) {
            entry.time = params.timestamp * 1000 - requestInfo[params.requestId].requestTime * 1000;
            entry.timings.receive = params.timestamp * 1000 - (resourceTime[params.requestId].receiveHeadersEnd + requestInfo[params.requestId].requestTime * 1000);
        }

    }
}

function blockRequest(debuggeeId, params) {
    var pageLen = logs[debuggeeId.tabId].log.pages.length;
    var page = logs[debuggeeId.tabId].log.pages[pageLen - 1];

    if (!page && (!requestInfo[params.requestId].url.indexOf('chrome-extension')
            || !requestInfo[params.requestId].url))
        return true;

    if (page) {
        if (!page.startedDateTime && (!requestInfo[params.requestId].url.indexOf('chrome-extension')
                || !requestInfo[params.requestId].url))
            return true;
    }

    return false;
}

function sendLogsToServer(tabId) {
    if (logs[tabId]) {

        if (!logs[tabId].log.pages.length) {
            logs[tabId] = null;
            return;
        }

        var idx = logs[tabId].log.pages.length - 1;
        logs[tabId].log.pages[idx]._closeDateTime = new Date().toISOString();

        var send = function (message, callback) {
            waitForConnection(function () {
                socket.send(message);
                if (typeof callback !== 'undefined') {
                    callback();
                }
            }, 1000);
        };

        var waitForConnection = function (callback, interval) {
            if (socket.readyState === 1) {
                callback();
            } else {
                // optional: implement backoff for interval here
                setTimeout(function () {
                    waitForConnection(callback, interval);
                }, interval);
            }
        };

        send(JSON.stringify(logs[tabId]));
        console.log('tabid ' + tabId + ' is sent');

        logs[tabId] = null;
    }
}