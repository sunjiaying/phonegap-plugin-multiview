

var webview;
var messageForSecondaryView = "";

// creates a webview to host content
function createWebview(url, message) {

    messageForSecondaryView = message;
    webview = document.createElement('x-ms-webview');
    var style = webview.style;
    style.position = 'absolute';
    style.top = '10%';
    style.left = '10%';
    style.zIndex = 100;
    style.width = '80%';
    style.height = '80%';
    style.background = "#F03";

    webview.addEventListener("MSWebViewNavigationCompleted", navigationCompletedEvent, false);
    webview.addEventListener("MSWebViewNavigationStarting", navigationStartingEvent, false);
    webview.addEventListener("MSWebViewScriptNotify", scriptNotify);

    document.body.appendChild(webview);
    webview.src = url;
    return webview;
}

// handles webview's navigation starting event
function navigationStartingEvent(evt) {
    if (evt.uri && evt.uri !== "") {
		// TODO: possibly block navigation to non whitelisted content
    }
}

function navigationCompletedEvent(evt) {

}

function sendCallback(callbackId, isSuccess, status, args, keepCallback) {
    // cordova.callbackFromNative: function(callbackId, isSuccess, status, args, keepCallback) {
    var evalScript = "cordova.callbackFromNative(\"" + callbackId + "\",true,1,[" + args + "],false)";
    var asyncOp = webview.invokeScriptAsync('eval', [evalScript]);
    asyncOp.oncomplete = function (res) {
        console.log("success sendCallback");
    };
    asyncOp.onerror = function (err) {
        console.log("onerror sendCallback " + err);
    };
    asyncOp.start();
}

function scriptNotify(e) {
    console.log('scriptNotify e: ' + e.value);
    // {"service":"PGMultiView","action":"getMessage","callbackId":"PGMultiView510812321","args":[]}
    var opts = JSON.parse(e.value);
    var onSuccess = function (result) {
        sendCallback(opts.callbackId, true, 1, JSON.stringify(result), false);
    }
    var onError = function () {
        sendCallback(opts.callbackId, false, 9, [], false);
    }
    cordova.exec(onSuccess, onError, opts.service, opts.action, opts.args);
}

var loadCallbacks;
// the visible interface
module.exports = {
	loadView:function(win, fail, args) {
	    console.log("loadview proxy called with " + args);
	    loadCallbacks = { win, win, fail, fail };
	    createWebview(args[0],args[1]);
	},
	dismissView:function(win, fail, args) {
	    console.log("dismissView proxy called with " + args);
	    messageForSecondaryView = JSON.stringify(args[0]);
	    document.body.removeChild(webview);
	    loadCallbacks.win(args[0]);
	    win();
	},
    getMessage:function(win,fail,args) {
        console.log("getMessage proxy called with " + args);
        win(messageForSecondaryView);
    }
};

require("cordova/exec/proxy").add("PGMultiView", module.exports);
