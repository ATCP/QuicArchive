
var socket = new WebSocket('ws://127.0.0.1:1337');

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



function uploadHarLog(requestId) {
    if (requestInfo[requestId].noLoad <= 0) {
        //console.log(JSON.stringify(requestInfo[params.requestId], null, '\t'));
        //socket.send(JSON.stringify(requestInfo[requestId]));
    }
}



chrome.webRequest.onBeforeRequest.addListener(
    function(details) {

        if (details.tabId)
            console.log('tabId:' + details.tabId + ' url ' + details.url + ' requestId: ' + details.requestId);
    },
    {urls: ["<all_urls>"]}
);


