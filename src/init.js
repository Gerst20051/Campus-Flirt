(function(){
	var a = "link",
		b = "script",
		c = "stylesheet",
		d = "createElement",
		e = "setAttribute",
		f = "getElementsByTagName",
		g = window.navigator.userAgent,
		h = g.indexOf("Firefox") !== -1 || g.indexOf("Opera") !== -1 ? true : false,
		i = ["base.css","style.css","http://www.eyecon.ro/datepicker/css/datepicker.css"],
		j = ["http://code.jquery.com/jquery.min.js","http://www.eyecon.ro/datepicker/js/datepicker.js","functions.js","script.js"],
		l = 0,
		n,
		m;
	for (m = i.length; l < m; ++l) {
		if (h) {
			n = document[d](a);
			n[e]("rel", c);
			n[e]("href", i[l]);
			document[f]("head")[0].appendChild(n)
		} else {
			document.write("<" + a + ' rel="' + c + '" href="' + i[l] + '" />')
		}
	}
	for (l = 0, m = j.length; l < m; ++l) {
		if (h) {
			n = document[d](b);
			n[e]("src", j[l]);
			document[f]("head")[0].appendChild(n)
		} else {
			document.write("<" + b + ' src="' + j[l] + '"></' + b + ">")
		}
	}
})();