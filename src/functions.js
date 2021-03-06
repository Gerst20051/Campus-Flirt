window.log = function(string){
	log.history = log.history || [];
	log.history.push(string);
	if (this.console) console.log(Array.prototype.slice.call(arguments));
};

window.log.clear = function(){
	log.history = log.history || [];
	log.history.length = 0;
};

window.keys = {
ALT: 18,
BACKSPACE: 8,
CAPS_LOCK: 20,
CLEAR: 12,
CTRL: 17,
DELETE: 46,
DELETE2: 63272,
DOWN_ARROW: 40,
DOWN_ARROW2: 63233,
END: 35,
END2: 63275,
ENTER: 13,
ENTER2: 3,
ESCAPE: 27,
F1: 112,
F2: 113,
F3: 114,
F4: 115,
F5: 116,
F6: 117,
F7: 118,
F8: 119,
F9: 120,
F10: 121,
F11: 122,
F12: 123,
F13: 124,
F14: 125,
F15: 126,
F1_SAFARI: 63236,
F2_SAFARI: 63237,
F3_SAFARI: 63238,
F4_SAFARI: 63239,
F5_SAFARI: 63240,
F6_SAFARI: 63241,
F7_SAFARI: 63242,
F8_SAFARI: 63243,
F9_SAFARI: 63244,
F10_SAFARI: 63245,
F11_SAFARI: 63246,
F12_SAFARI: 63247,
HELP: 47,
HOME: 36,
HOME2: 63273,
INSERT: 45,
INSERT2: 63302,
LEFT_ARROW: 37,
LEFT_ARROW2: 63234,
LEFT_WINDOW: 91,
NUMPAD_0: 96,
NUMPAD_1: 97,
NUMPAD_2: 98,
NUMPAD_3: 99,
NUMPAD_4: 100,
NUMPAD_5: 101,
NUMPAD_6: 102,
NUMPAD_7: 103,
NUMPAD_8: 104,
NUMPAD_9: 105,
NUMPAD_DIVIDE: 111,
NUMPAD_ENTER: 108,
NUMPAD_MINUS: 109,
NUMPAD_MULTIPLY: 106,
NUMPAD_PERIOD: 110,
NUMPAD_PLUS: 107,
NUM_LOCK: 144,
NUM_LOCK2: 12,
NUM_LOCK3: 63289,
PAGE_DOWN: 34,
PAGE_DOWN2: 63277,
PAGE_UP: 33,
PAGE_UP2: 63276,
PAUSE: 19,
PAUSE_OLD2: 63250,
PRINT_SCREEN: 44,
PRINT_SCREEN2: 63248,
RIGHT_ARROW: 39,
RIGHT_ARROW2: 63235,
RIGHT_WINDOW: 92,
SCROLL_LOCK: 63249,
SCROLL_LOCK2: 63249,
SELECT: 93,
SHIFT: 16,
SHIFT_TAB: 25,
SPACE: 32,
TAB: 9,
UP_ARROW: 38,
UP_ARROW2: 63232
};

window.Hash = {
	query: {},
	getHash: function(){return decodeURIComponent(window.location.hash.substring(1))},
	clearHash: function(){window.location.replace("#")},
	setHash: function(hash){window.location.replace("#"+encodeURI(hash))},
	get: function(key){
		if (this.has(key)) {
			return this.query[key];
		}
	},
	clear: function(){
		this.query = {};
		this.update();
	},
	set: function(key, value){
		if (value != null) {
			this.query[key] = value;
			this.update();
			return value;
		}
	},
	has: function(key) {
		return this.query[key] != null;
	},
	parse: function(){
		var that = this;
		this.getHash().replace(
		    new RegExp("([^?=&]+)(=([^&]*))?", "g"),
		    function($0, $1, $2, $3) { that.query[$1] = $3; }
		);
		return this.query;
	},
	update: function(){
		this.setHash("?"+$.param(this.query));
	}
};

$.fn.clearForm = function(){
	return this.each(function(){
		$(this).find("input, select, textarea").not(':input[type=radio], :input[type=button], :input[type=submit], :input[type=reset], :input[type=hidden]').val('');
		$(this).find("input[type=radio], input[type=checkbox]").each(function(){
			$(this).attr('checked', false);
		});
	});
};

function timestamp(){
	return Date.now && Date.now() || +new Date;
}

function timestamp_php(){
	return Date.now && window.parseInt(Date.now() / 1000, 10) || window.parseInt(+new Date / 1000, 10);
}

function today(datetime){
	var today = new Date(timestamp());
	return (datetime.getDate() == today.getDate() && datetime.getMonth() == today.getMonth() && datetime.getYear() == today.getYear());
}

function yesterday(datetime){
	var yesterday = new Date(timestamp() - 86400000);
	return (datetime.getDate() == yesterday.getDate() && datetime.getMonth() == yesterday.getMonth() && datetime.getYear() == yesterday.getYear());
}

function stringToBoolean(string){
	if (typeof string == "undefined") {
		log("stringToBoolean Undefined Error");
		return false;
	}
	if (typeof string == "boolean") return string;
	switch (string.toLowerCase()) {
		case "true": case "yes": case "1": return true;
		case "false": case "no": case "0": case null: return false;
		default: return false;
	}
}

function empty(mixed){
	var key;
	if (mixed === "" || mixed === 0 || mixed === "0" || mixed === null || mixed === false || typeof mixed === 'undefined') return true;
	if (typeof mixed == 'object') {
		for (key in mixed) return false;
		return true;
	}
	return false;
}

function strrchr(haystack, needle){
	var pos = 0;
	if (typeof needle !== 'string') {
		needle = String.fromCharCode(parseInt(needle, 10));
	}
	needle = needle.charAt(0);
	pos = haystack.lastIndexOf(needle);
	if (pos === -1) {
		return false;
	}
	return haystack.substr(pos);
}

function addSlashes(str){
	return (str + '').replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0');
}

function stripSlashes(str){
	return (str + '').replace(/\\(.?)/g, function(s, n1){
		switch (n1) {
			case '\\': return '\\';
			case '0': return '\u0000';
			case '': return '';
			default: return n1;
		}
	});
}

function isDefined(variable){
	return (typeof window[variable] === "undefined") ? false : true;
}

function isMobile(){
	var ua = navigator.userAgent;
	if (ua.match(/Android/i) ||
	ua.match(/webOS/i) ||
	ua.match(/iPhone/i) ||
	ua.match(/iPod/i) ||
	ua.match(/iPad/i) ||
	ua.match(/BlackBerry/)
	) return true;
	else return false;
}

function hasModifier(){
	return !!((this.ctrlKey || this.altKey) || this.shiftKey);
}

function bind(fnThis, fn){
	var args = Array.prototype.slice.call(arguments, 2);
	return function(){
		if (0 < args.length) arguments = args;
		return fn.apply(fnThis, arguments);
	};
}

(function(){
	window._gaq=[['_setAccount','UA-37052695-1'],['_trackPageview']];
	var ga=document.createElement('script');ga.type='text/javascript';ga.async=true;
	ga.src=('https:'==document.location.protocol?'https://ssl':'http://www')+'.google-analytics.com/ga.js';
	var s=document.getElementsByTagName('script')[0];s.parentNode.insertBefore(ga,s);
})();