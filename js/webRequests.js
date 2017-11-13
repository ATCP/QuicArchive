
var socket;

function connect() {
    socket = new WebSocket('ws://128.110.96.149:1337');

    socket.onopen = function (event) {
        console.log((new Date()) + " connected to server\n");
    };

    socket.onerror = function (err) {
        console.error('Socket encountered error: ', err.message, 'Closing socket');
        socket.close();
    };

    socket.onmessage = function (message) {
        console.log('Message:', message.data);
    };

    socket.onclose = function (e) {

        console.log('Socket is closed. Reconnect will be attempted in 1 second.', e.reason);
        setTimeout(function() {
            connect();
        }, 1000);
    };

}


var filter = {
    //urls: ["<all_urls>"]
    urls: ["*://www.1.com/*"]
    //types: [ "main_frame", "sub_frame", "stylesheet", "script", "image", "object", "xmlhttprequest", "other"]
};

var count = {};

chrome.webRequest.onBeforeRequest.addListener(function(details) {

    var requestId = details.requestId;
    var block = false;

    if (count[requestId] == undefined)
        count[requestId] = 0;

    count[requestId] ++;

    if (count[requestId] < 1) {
        block = true;
    }

    console.log(details.url);
    return {cancel: block};

    }, filter, ["blocking", "requestBody"]);

chrome.webRequest.onBeforeSendHeaders.addListener(function(details){

    for (var i = 0; i < details.requestHeaders.length; ++i) {
        if (details.requestHeaders[i].name == 'User-Agent') {
            details.requestHeaders[i].value = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/603.3.8 (KHTML, like Gecko)';
        }
        else if (details.requestHeaders[i].name == 'Cookie') {
            etails.requestHeaders[i].value = '';
        }

    }

    //details.requestHeaders.push({name: "Upgrade", value: "websocket"});

    return {requestHeaders: details.requestHeaders};
}, filter, ["blocking", "requestHeaders"]);

var block = false;

chrome.webRequest.onHeadersReceived.addListener(function (details) {

    for (var i = 0; i < details.responseHeaders.length; ++i) {
        if (details.responseHeaders[i].name == 'alt-svc') {
            details.responseHeaders[i].value = '';

        } else if (details.responseHeaders[i].name == 'client-protocol') {
            details.responseHeaders[i].value = '';
        }

    }

    //return {responseHeaders: details.responseHeaders};
    return {cancel: block};

}, filter, ["blocking", "responseHeaders"]);