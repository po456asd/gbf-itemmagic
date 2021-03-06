const rarity = ["dummy", "N ", "R ", "SR ", "SSR "];

var minDelay, maxDelay;

(function() {
	var summons, rarity, angels;
	
	chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
		if(!("action" in request) || request.action !== "sell") {
			return;
		}
		
		if(!("summons" in request) || !("rarity" in request) || !("angels" in request)) {
			return;
		}
		
		summons = request.summons;
		rarity = request.rarity;
		angels = request.angels;
		
		getUid(function(uid) {
			chrome.storage.sync.get({
				minDelay: 300,
				maxDelay: 800
			}, function(items) {
				minDelay = items.minDelay;
				maxDelay = items.maxDelay;
				
				sell(uid, summons, rarity, angels);
			});
		});
	});
	
	function sell(uid, summons, rarity, angels) {
		var url = buildUrl("/sell/content/index", uid);
		
		var req = new XMLHttpRequest();
		req.open("GET", url);
		
		req.onload = function() {
			var data = decodeURIComponent(JSON.parse(req.responseText).data);
			var duplicate_key = data.replace(/^[\s\S]*data-duplicate-key="([0-9a-f]+)"[\s\S]*$/, "$1");
			
			getList(uid, summons, rarity, angels, duplicate_key, 1, []);
		};
		
		req.send();
	}

	function getList(uid, summons, rarity, angels, duplicate_key, index, list) {
		var url = buildUrl("/" + (summons ? "summon" : "weapon") + "/list/" + index + "/3", uid);
		
		var req = new XMLHttpRequest();
		req.open("POST", url);
		req.setRequestHeader("Content-Type", "application/json");
		
		req.onload = function() {
			var response = JSON.parse(req.responseText);
			
			for(var i = 0; i < response.list.length; i++) {
				var entry = response.list[i];
				if(entry.master.rarity <= rarity && entry.param.quality === "0" && (angels || (summons && angelSummonIds.indexOf(entry.master.id) < 0) || (!summons && angelWeaponIds.indexOf(entry.master.id) < 0)) && devilElementIds.indexOf(entry.master.id) < 0) {
					list.push(entry);
				}
			}
			
			if(response.next <= index) {
				// Done
				if(list.length === 0) {
					alert("No " + (summons ? "summons" : "weapons") + " were found matching the criteria.");
					return;
				}
				
				if(window.confirm(list.length + " " + (summons ? "summon" : "weapon") + (list.length > 1 ? "s" : "") + " will be sold.")) {
					var ids = list.map(function(val) {
						return val.param.id;
					});
					
					confirmSell(ids, summons, uid, duplicate_key, ids.length, 0);
				}
			} else {
				// There are more pages, keep going
				getList(uid, summons, rarity, angels, duplicate_key, index + 1, list);
			}
		};
		
		req.onerror = function() {
			alert("An error occurred while trying to get what could be sold.");
		};
		
		req.send(JSON.stringify({special_token: null, is_new: false}));
	}

	function confirmSell(ids, summons, uid, duplicate_key, count, amount) {
		var url = buildUrl("/sell/confirm/" + (summons ? "2" : "1"), uid);
		
		var req = new XMLHttpRequest();
		req.open("POST", url);
		req.setRequestHeader("Content-Type", "application/json");
		
		req.onload = function() {
			amount += JSON.parse(req.responseText).sold;
			
			setTimeout(function() {
				doSell(ids, summons, uid, duplicate_key, count, amount);
			}, randomInt(minDelay, maxDelay));
		};
		
		req.onerror = function() {
			alert("An error occurred while trying to confirm selling.");
		};
		
		req.send(JSON.stringify({special_token: null, materials: ids.slice(0, 20)}));
	}

	function doSell(ids, summons, uid, duplicate_key, count, amount) {
		var url = buildUrl("/sell/execute/" + (summons ? "2" : "1"), uid);
		
		var req = new XMLHttpRequest();
		req.open("POST", url);
		req.setRequestHeader("Content-Type", "application/json");
		
		req.onload = function() {
			if(JSON.parse(req.responseText).success) {
				if(ids.length <= 20) {
					alert(count + " " + (summons ? "summon" : "weapon") + (count > 1 ? "s were" : " was") + " sold for " + amount + " rupee" + (amount > 1 ? "s." : "."));
				} else {
					ids.splice(0, 20);
					setTimeout(function() {
						confirmSell(ids, summons, uid, duplicate_key, count, amount);
					}, randomInt(minDelay, maxDelay));
				}
			} else {
				alert("An error occurred while trying to execute selling.");
			}
		};
		
		req.onerror = function() {
			alert("An error occurred while trying to execute selling.");
		};
		
		req.send(JSON.stringify({special_token: null, materials: ids.slice(0, 20), duplicate_key: duplicate_key + "_" + ids.slice(0, 20).join("_")}));
	}
})();
