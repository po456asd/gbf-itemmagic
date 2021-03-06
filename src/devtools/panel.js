// Listen to button presses
function addClickHandlers() {
	document.getElementById("setNumTickets").addEventListener("click", function() {
		document.getElementById("numTickets").disabled = !document.getElementById("setNumTickets").checked;
	});
	
	document.getElementById("sellWeapons").addEventListener("click", function() {
		chrome.runtime.sendMessage({
			action: "sell",
			summons: false,
			rarity: document.getElementById("rarity").value,
			angels: document.getElementById("angels").checked,
			tabId: chrome.devtools.inspectedWindow.tabId
		});
	});
	
	document.getElementById("sellSummons").addEventListener("click", function() {
		chrome.runtime.sendMessage({
			action: "sell",
			summons: true,
			rarity: document.getElementById("rarity").value,
			angels: document.getElementById("angels").checked,
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
			numTickets: numTickets,
			autoReset: document.getElementById("autoReset").checked,
			tabId: chrome.devtools.inspectedWindow.tabId
		});
	});
	
	document.getElementById("stash").addEventListener("click", function() {
		chrome.runtime.sendMessage({
			action: "stash",
			summons: document.getElementById("stashSummons").checked,
			stashNum: document.getElementById("stashNum").value,
			tabId: chrome.devtools.inspectedWindow.tabId
		});
	});
}

document.addEventListener("DOMContentLoaded", addClickHandlers);
