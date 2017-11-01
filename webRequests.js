
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


function uploadHarLog(requestId) {
    if (requestInfo[requestId].noLoad <= 0) {
        //console.log(JSON.stringify(requestInfo[params.requestId], null, '\t'));
        //socket.send(JSON.stringify(requestInfo[requestId]));
    }
}



chrome.webRequest.onBeforeRequest.addListener(
    function(details) {

        //if (details.tabId)
            //console.log('tabId:' + details.tabId + ' url ' + details.url + ' requestId: ' + details.requestId);
    },
    {urls: ["<all_urls>"]}
);


