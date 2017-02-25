
var cordova = require('cordova');
var execProxy = require('cordova/exec/proxy');

if (window.external) {
    
    var prevProxy = require('cordova/exec/proxy');
    cordova.define.remove('cordova/exec');

    var newExec = module.exports = function (success, fail, service, action, args) {
        console.log(service + ":" + action);
        var callbackId = service + cordova.callbackId++;
        if (typeof success == "function" || typeof fail == "function") {
            cordova.callbacks[callbackId] = { success: success, fail: fail };
        }
        args = args || [];

        var command = JSON.stringify({
            'service': service,
            'action': action,
            'callbackId': callbackId,
            'args': args
        });
        // pass it on to Notify
        try {
            window.external.notify(command);
        }
        catch (e) {
            console.log("Exception calling native with command :: " + command + " :: exception=" + e);
        }
    }

    cordova.define("cordova/exec", function (require, exports, module) {
        module.exports = newExec;
    });
}
else {
    module.exports = function (success, fail, service, action, args) {

        var proxy = execProxy.get(service, action),
            callbackId,
            onSuccess,
            onError;

        args = args || [];

        if (proxy) {
            callbackId = service + cordova.callbackId++;
            // console.log("EXEC:" + service + " : " + action);
            if (typeof success === "function" || typeof fail === "function") {
                cordova.callbacks[callbackId] = {success: success, fail: fail};
            }
            try {
                // callbackOptions param represents additional optional parameters command could pass back, like keepCallback or
                // custom callbackId, for example {callbackId: id, keepCallback: true, status: cordova.callbackStatus.JSON_EXCEPTION }
                // CB-5806 [Windows8] Add keepCallback support to proxy
                onSuccess = function (result, callbackOptions) {
                    callbackOptions = callbackOptions || {};
                    var callbackStatus;
                    // covering both undefined and null.
                    // strict null comparison was causing callbackStatus to be undefined
                    // and then no callback was called because of the check in cordova.callbackFromNative
                    // see CB-8996 Mobilespec app hang on windows
                    if (callbackOptions.status !== undefined && callbackOptions.status !== null) {
                        callbackStatus = callbackOptions.status;
                    }
                    else {
                        callbackStatus = cordova.callbackStatus.OK;
                    }
                    cordova.callbackSuccess(callbackOptions.callbackId || callbackId,
                        {
                            status: callbackStatus,
                            message: result,
                            keepCallback: callbackOptions.keepCallback || false
                        });
                };
                onError = function (err, callbackOptions) {
                    callbackOptions = callbackOptions || {};
                    var callbackStatus;
                    // covering both undefined and null.
                    // strict null comparison was causing callbackStatus to be undefined
                    // and then no callback was called because of the check in cordova.callbackFromNative
                    // see CB-8996 Mobilespec app hang on windows
                    if (callbackOptions.status !== undefined && callbackOptions.status !== null) {
                        callbackStatus = callbackOptions.status;
                    }
                    else {
                        callbackStatus = cordova.callbackStatus.OK;
                    }
                    cordova.callbackError(callbackOptions.callbackId || callbackId,
                        {
                            status: callbackStatus,
                            message: err,
                            keepCallback: callbackOptions.keepCallback || false
                        });
                };
                proxy(onSuccess, onError, args);

            } catch (e) {
                console.log("Exception calling native with command :: " + service + " :: " + action  + " ::exception=" + e);
            }
        } else {
            if (typeof fail === "function") {
                fail("Missing Command Error");
            }
        }
    };
}

