(function() {
    var minDelay, maxDelay;
    var uid;
    var eventName;
    var empty;
    var max;
    var autoReset;

    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        if(!("action" in request) || request.action !== "gacha") {
            return;
        }
        
        if(!("empty" in request) || !("numTickets" in request) || !("autoReset" in request)) {
            return;
        }
        
        empty = request.empty;
        max = request.numTickets;
        autoReset = request.autoReset;
        
        var hash = window.location.hash;
        if(hash.length === 0 || !hash.startsWith("#event/")) {
            alert("Please navigate to the event page first.");
            return;
        }
        
        eventName = hash.replace(/^#event\/(.*?)(\/.*?)?$/, "$1");
        if(!eventName) {
            alert("Invalid event page URL.");
            return;
        }
        
        var gachaButtons = document.getElementsByClassName("btn-medal");
        if(gachaButtons.length === 0) {
            alert("Please navigate to the gacha page first.");
            return;
        }
        
        if(!empty) {
            if(hasResetButton(document)) {
                resetBox(document, doGetUid);
                return;
            }
        }
        
        doGetUid(document);
    });
    
    function doGetUid(doc) {
        getUid(function(uidResult) {
            uid = uidResult;
            chrome.storage.sync.get({
                minDelay: 300,
                maxDelay: 800
            }, function(items) {
                minDelay = items.minDelay;
                maxDelay = items.maxDelay;
                
                gacha(doc);
            });
        });
    }

    function gacha(doc) {
        var gachaButtons = doc.getElementsByClassName("btn-medal");
        var multi, single;
        
        if(gachaButtons.length === 2) {
            multi = gachaButtons[0];
            single = gachaButtons[1];
        } else {
            multi = null;
            single = gachaButtons[0];
        }
        
        if(single.getAttribute("disable") === "true") {
            var tickets = getNumTickets(doc);
            
            if(tickets > 1) {
                if(!autoReset) {
                    alert("The box is empty. Please reset the box and try again.");
                } else {
                    resetBox(doc, gacha);
                }
            } else {
                alert("Out of tickets.");
            }
            
            return;
        }
        
        if(max !== null && max <= 0) {
            alert("Complete. You have " + getNumTickets(doc) + " tickets remaining.");
            return;
        }
        
        var id = single.getAttribute("data-id");
        var duplicateKey = single.getAttribute("data-duplicate-key");
        var count = 1;
        
        if(multi !== null) {
            count = multi.getAttribute("count");
        }
        
        if(max !== null && max < count * 2) {
            count = 1;
        }
        
        var url = buildUrl("/" + eventName + "/gacha/play", uid);
        
        var req = new XMLHttpRequest();
        req.open("POST", url);
        
        req.onload = function() {
            if(max) {
                max -= count * 2;
            }
            contentAction(id);
        };
        
        req.send(JSON.stringify({special_token: null, gacha_id: id, count: count, duplicate_key: duplicateKey}));
    }

    function contentAction(eventId) {
        var url = buildUrl("/" + eventName + "/gacha/content/action/" + eventId, uid);
        var seq = url.replace(/.*_=([\d]+).*/, "$1");
        
        var req = new XMLHttpRequest();
        req.open("GET", url);
        
        req.onload = function() {
            result1(eventId, seq);
        };
        
        req.send();
    }

    function result1(eventId, seq) {
        seq++;
        var url = buildUrl("/" + eventName + "/gacha/result/" + eventId, uid, seq);
        
        var req = new XMLHttpRequest();
        req.open("GET", url);
        
        req.onload = function() {
            contentResult(eventId, seq);
        };
        
        req.send();
    }

    function contentResult(eventId, seq) {
        seq++;
        var url = buildUrl("/" + eventName + "/gacha/content/result/" + eventId, uid, seq);
        
        var req = new XMLHttpRequest();
        req.open("GET", url);
        
        req.onload = function() {
            var docString = decodeURIComponent(JSON.parse(req.responseText).data);
            var doc = new DOMParser().parseFromString(docString, "text/html");
            
            result2(eventId, seq, doc);
        };
        
        req.send();
    }

    function result2(eventId, seq, doc) {
        seq++;
        var url = buildUrl("/" + eventName + "/gacha/result/" + eventId, uid, seq);
        
        var req = new XMLHttpRequest();
        req.open("GET", url);
        
        req.onload = function() {
            var response = JSON.parse(req.responseText);
            if(!empty) {
                for(var i = 0; i < response.result.length; i++) {
                    if(response.result[i].reward_rare_val == 4) {
                        if(!autoReset) {
                            alert("SSR pulled. You have " + getNumTickets(doc) + " tickets remaining.");
                        } else {
                            if(hasResetButton(doc)) {
                                resetBox(doc, gacha);
                            } else {
                                alert("SSR pulled but can't reset. Please enable the option to not stop on SSR.");
                            }
                        }
                        return;
                    }
                }
            }
            
            if(max === 0) {
                var tickets = getNumTickets(doc);
                
                alert("Complete. You have " + getNumTickets(doc) + " tickets remaining.");
                return;
            }
            
            setTimeout(function() {
                gacha(doc);
            }, randomInt(minDelay, maxDelay));
        };
        
        req.send();
    }

    function getNumTickets(doc) {
        if(doc.getElementsByClassName("txt-gacha-point").length > 0) {
            return doc.getElementsByClassName("txt-gacha-point")[0].innerHTML;
        } else {
            return doc.getElementsByClassName("txt-current-point")[0].innerHTML;
        }
    }

    function hasResetButton(doc) {
        return doc.getElementsByClassName("btn-reset").length > 0;
    }

    function resetBox(doc, callback) {
        var resetButton = doc.getElementsByClassName("btn-reset")[0];
        var gachaId = resetButton.getAttribute("data-gacha-id");
        var boxId = resetButton.getAttribute("data-box-id");
        var duplicateKey = resetButton.getAttribute("data-duplicate-key");
        
        var url = buildUrl("/" + eventName + "/gacha/reset_box", uid);
        
        var req = new XMLHttpRequest();
        req.open("POST", url);
        
        req.onload = function() {
            getGachaIndex(callback);
        };
        
        req.send(JSON.stringify({special_token: null, gacha_id: gachaId, box_id: boxId, duplicate_key: duplicateKey}));
    }
    
    function getGachaIndex(callback) {
        var url = buildUrl(eventName.startsWith("teamraid") ? ("/" + eventName + "/gacha/content/index")
            : ("/" + eventName + "/top/content/newindex"), uid);
        
        var req = new XMLHttpRequest();
        req.open("GET", url);
        
        req.onload = function() {
            var docString = decodeURIComponent(JSON.parse(req.responseText).data);
            var doc = new DOMParser().parseFromString(docString, "text/html");
            
            callback(doc);
        };
        
        req.send();
    }
})();
