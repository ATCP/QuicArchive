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

function createHAR(request, response, resource) {
    var entries = [];

    // Exclude Data URI from HAR file because
    // they aren't included in specification
    if (request.url.match(/(^data:image\/.*)/i)) {
        return;
    }


    entries.push({
        startedDateTime: request.time.toISOString(),
        time: endReply.time - request.time,
        request: {
            method: request.method,
            url: request.url,
            httpVersion: null,
            cookies: [],
            headers: request.headers,
            queryString: [],
            headersSize: -1,
            bodySize: -1
        },
        response: {
            status: endReply.status,
            statusText: endReply.statusText,
            httpVersion: "HTTP/1.1",
            cookies: [],
            headers: endReply.headers,
            redirectURL: "",
            headersSize: -1,
            bodySize: startReply.bodySize,
            content: {
                size: startReply.bodySize,
                mimeType: endReply.contentType
            }
        },
        cache: {},
        timings: {
            blocked: 0,
            dns: -1,
            connect: -1,
            send: 0,
            wait: startReply.time - request.time,
            receive: endReply.time - startReply.time,
            ssl: -1
        },
        pageref: address
    });

    return {
        log: {
            version: '1.2',
            creator: {
                name: "quicArchive",
                version: 1.0
            },
            pages: [{
                startedDateTime: startTime.toISOString(),
                id: address,
                title: title,
                pageTimings: {
                    onLoad: page.endTime - page.startTime
                }
            }],
            entries: entries
        }
    };
}