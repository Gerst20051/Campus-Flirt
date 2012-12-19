(function(){
	var a = "link",
		b = "script",
		c = "stylesheet",
		d = "createElement",
		e = "setAttribute",
		f = "getElementsByTagName",
		g = window.navigator.userAgent,
		h = g.indexOf("Firefox") !== -1 || g.indexOf("Opera") !== -1 ? true : false,
		i = ["base.css","style.css","http://code.jquery.com/ui/1.9.2/themes/mint-choc/jquery-ui.css","jquery-ui-timepicker.css"],
		j = ["http://code.jquery.com/jquery.min.js","http://platform.twitter.com/widgets.js","https://apis.google.com/js/plusone.js","http://connect.facebook.net/en_US/all.js#xfbml=1&appId=105754722866948","http://code.jquery.com/ui/1.9.2/jquery-ui.min.js","jquery-ui-timepicker.js","jquery-ui-slider.js","functions.js","script.js"],
		head = document[f]("head")[0],
		l = 0,
		n,
		m;
	for (m = i.length; l < m; ++l) {
		if (h) {
			n = document[d](a);
			n[e]("rel", c);
			n[e]("href", i[l]);
			head.appendChild(n)
		} else {
			document.write("<" + a + ' rel="' + c + '" href="' + i[l] + '" />')
		}
	}
	for (l = 0, m = j.length; l < m; ++l) {
		if (h) {
			n = document[d](b);
			n.src = j[l];
			head.appendChild(n)
		} else {
			document.write("<" + b + ' src="' + j[l] + '"></' + b + ">")
		}
	}
})();