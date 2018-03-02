
var socket;

function connect() {
    socket = new WebSocket('ws://128.46.202.232:1337');

    //socket = new WebSocket('ws://127.0.0.1:1337');

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
    urls: ["http://*/*"]
    //types: [ "main_frame", "sub_frame", "stylesheet", "script", "image", "object", "xmlhttprequest", "other"]
};

var count = {};

chrome.webRequest.onBeforeRequest.addListener(function(details) {


    var requestId = details.requestId;
    var url = details.url;


    return {cancel: block};

    }, filter, ["blocking", "requestBody"]);

chrome.webRequest.onBeforeSendHeaders.addListener(function(details){


    for (var i = 0; i < details.requestHeaders.length; ++i) {

        if (details.requestHeaders[i].name.toLowerCase() == 'user-agent') {
            //details.requestHeaders[i].value = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/603.3.8 (KHTML, like Gecko)';
        }
        else if (details.requestHeaders[i].name.toLowerCase() == 'cookie') {
            //details.requestHeaders[i].value = '';
        }
        else if (details.requestHeaders[i].name.toLowerCase() == 'upgrade-insecure-requests') {
            details.requestHeaders.splice(i, 1);

        }
        else if (details.requestHeaders[i].name.toLowerCase() == 'http2-settings') {
            details.requestHeaders.splice(i, 1);
        }
        else if (details.requestHeaders[i].name.toLowerCase() == 'upgrade') {
            details.requestHeaders.splice(i, 1);
        }
        else if (details.requestHeaders[i].name.toLowerCase() == 'connection') {
            details.requestHeaders[i].value = 'keep-alive';

        }

    }



    return {requestHeaders: details.requestHeaders};
}, filter, ["blocking", "requestHeaders"]);

var block = false;

chrome.webRequest.onHeadersReceived.addListener(function (details) {

    for (var i = 0; i < details.responseHeaders.length; ++i) {
        if (toLowerCase(details.responseHeaders[i].name) == 'alt-svc') {
            details.responseHeaders[i].value = '';

        } else if (toLowerCase(details.responseHeaders[i].name) == 'client-protocol') {
            details.responseHeaders[i].value = '';
        }

    }

    return {responseHeaders: details.responseHeaders};
    //return {cancel: block};

}, filter, ["blocking", "responseHeaders"]);