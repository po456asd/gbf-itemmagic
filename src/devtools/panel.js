var uid = null;

// Listen to button presses
function addClickHandlers() {
	document.getElementById("setNumTickets").addEventListener("click", function() {
			document.getElementById("numTickets").disabled = !document.getElementById("setNumTickets").checked;
		});
	
	document.getElementById("weapons").addEventListener("click", function() {
			chrome.runtime.sendMessage({
				action: "sell",
				summons: false,
				rarity: document.getElementById("rarity").selectedIndex + 1,
				angels: document.getElementById("angels").checked,
				uid: uid,
				tabId: chrome.devtools.inspectedWindow.tabId
			});
		});
	
	document.getElementById("summons").addEventListener("click", function() {
			chrome.runtime.sendMessage({
				action: "sell",
				summons: true,
				rarity: document.getElementById("rarity").selectedIndex + 1,
				angels: document.getElementById("angels").checked,
				uid: uid,
				tabId: chrome.devtools.inspectedWindow.tabId
			});
		});
	
	document.getElementById("gacha").addEventListener("click", function() {
			var numTickets = parseInt(document.getElementById("numTickets").value);
			
			if(numTickets % 2 === 1) {
				numTickets--;
			}
			
			if(document.getElementById("numTickets").disabled || isNaN(numTickets) || numTickets < 0) {
				numTickets = null;
			}
			
			chrome.runtime.sendMessage({
				action: "gacha",
				empty: document.getElementById("empty").checked,
				uid: uid,
				numTickets: numTickets,
				tabId: chrome.devtools.inspectedWindow.tabId
			});
		});
}

document.addEventListener("DOMContentLoaded", addClickHandlers);

// Listen to network requests
chrome.devtools.network.onRequestFinished.addListener(
	function(request) {
		// Get the user ID if we haven't already
		if(uid === null && request.request.url.indexOf("uid=") > -1) {
			uid = request.request.url.replace(/^.*uid=([\d]+).*$/, "$1");
			
			document.getElementById("wait").style.display = "none";
			document.getElementById("options").style.display = "block";
		}
	});