(function(window, document, $, undefined){
$ && main() || !function(){
	var s = document.createElement("script"), h = document.head || document.getElementsByTagName("head")[0] || document.documentElement, done = false;
	s.src = "jquery.js";
	s.onload = s.onreadystatechange = function(){
		if (!this.readyState || this.readyState == "complete" || this.readyState == "loaded") {
			if (!done && (done=true)) {
				main();
				s.onload = s.onreadystatechange = null;
				if (h && s.parentNode) h.removeChild(s);
				s = undefined;
			}
		}
	};
	h.insertBefore(s, h.firstChild);
}();

function main(){
if (main.run) return;
else main.run = true;

window.aC = {
title: "Campus Flirt",
ajaxurl: "ajax.php",
loaded: false,
logged: false,
loginFocus: false,
registerFocus: false,
currentPanel: "",
moreUpdates: false, // change to true
panels: ['post','myposts','messages','campusfeed','global'],
user: {},
previewFeed: [],
previewFeedIndex: 0,
previewFeedIntervalId: 0,
setPanel: function(id){
	if (id === this.currentPanel) return;
	if (-1 < $.inArray(id, this.panels)) {
		this.currentPanel = id;
		Hash.set("panel", id);
		$("#nav").find(".selected").removeClass("selected").end().find("."+id+"-link").addClass("selected");
		$("#panelcontent").children().hide().end().find("#"+id+"-panel").show();
	}
},
handleHash: function(){
	if (0 < Hash.getHash().length) {
		Hash.parse();
		if (this.logged === true) {
			if (Hash.has("panel")) {
				this.setPanel(Hash.get("panel"));
			}
		}
	}
},
init: function(){
	if (this.loaded !== false) return;
	var self = this;
	$.getJSON(this.ajaxurl, {action:"logged"}, function(response){
		self.loaded = true;
		if (response.logged === true) {
			self.logged = true;
			self.loggedIn();
		} else self.loggedOut();
		self.handleHash();
	});
	this.dom();
},
loggedIn: function(){
	if (this.logged !== true) return;
	var self = this;
	$.getJSON(this.ajaxurl, {action:"userdata"}, function(response){
		if (response.user !== false) {
			self.user = response.user;
			self.user.fullname = self.user.firstname+' '+self.user.lastname;
			$("#loggedin").show();
			$("#loggedout").hide();
			$("body").addClass("in").removeClass("out");
			$(".campusheading, .campusfeedheading").text(response.user.campus);
			$("#postflirt_datetime").datetimepicker();
			$("#postflirt_gender").buttonset();
			self.handleHash();
			if (self.currentPanel === "") self.setPanel("campusfeed");
			self.loadCampusFeed();
			self.loadGlobal();
			self.loadMyPosts();
			self.loadMessages();
			self.previewFeed = [];
			$("#previewfeedlist").empty();
			if (self.previewFeedIntervalId) {
				window.clearInterval(self.previewFeedIntervalId);
				self.previewFeedIntervalId = 0;
			}
		} else aC.logout();
	});
},
loggedOut: function(){
	if (this.logged !== false) return;
	this.loadPreviewFeed();
	$("#loggedout").show();
	$("#loggedin").hide();
	$("body").addClass("out").removeClass("in");
	$(".campusheading").empty();
},
login: function(){
	var self = this, e = false, $login = $("#f_login"), $email = $login.find("#lemail"), $password = $login.find("#lpassword");
	if ($.trim($email.val()) == "") { $email.addClass('error'); e = true; } else $email.removeClass('error');
	if ($.trim($password.val()) == "") { $password.addClass('error'); e = true; } else $password.removeClass('error');
	if (!e) {
		$login.find("input,select").attr('disabled',true);
		var output = {}, inputs = $login.find("input").filter("[name]");
		$.map(inputs, function(n, i){
			output[n.name] = $.trim($(n).val());
		});
		$.post(this.ajaxurl, {action:"login",form:output}, function(response){
			$login.find("input,select").attr('disabled',false);
			if (stringToBoolean(response.logged)) {
				$login.find("#reg_name, #reg_email, #reg_password").removeClass('error');
				$login.find("#b_login_splash").removeClass('error');
				$("#f_register").clearForm();
				$login.clearForm();
				self.logged = true;
				self.loggedIn();
			} else {
				$login.find("#b_login_splash").addClass('error');
				$password.val('');
			}
		});
	}
},
logout: function(){
	var self = this;
	$.post(this.ajaxurl, {action:"logout"}, function(response){
		if (!stringToBoolean(response.logged)) {
			self.logged = false;
			self.user = {};
			self.loggedOut();
			Hash.clear();
		}
	});
},
regValidate: function(){
	var e = false,
	$reg = $("#f_register"),
	$name = $reg.find("#reg_name"), name_trim = $.trim($name.val()),
	$email = $reg.find("#reg_email"), email_trim = $.trim($email.val()),
	$password = $reg.find("#reg_password"), password_trim = $.trim($password.val()),
	$gender = $reg.find("#reg_gender"), gender_trim = $.trim($gender.val()),
	nameReg = /[A-Za-z'-]/,
	emailReg = /^[^0-9][a-zA-Z0-9_]+([.][a-zA-Z0-9_]+)*[@][a-zA-Z0-9_]+([.][a-zA-Z0-9_]+)*[.][a-zA-Z]{2,4}?$/i,
	eduEmailReg = /^[^@  ]+@([a-zA-Z0-9\-]+\.)+([a-zA-Z0-9\-]{2}|edu)\$/;

	if (name_trim == "") { $name.addClass('error'); e = true; }
	else if (!nameReg.test(name_trim)) { $name.addClass('error'); e = true; }
	else if (name_trim.split(' ').length < 2) { $name.addClass('error'); e = true; } else $name.removeClass('error');

	if (email_trim == "") { $email.addClass('error'); e = true; }
	else if (!emailReg.test(email_trim)) { $email.addClass('error'); e = true; }
	else if (!strrchr(email_trim, ".") === ".edu") { alert("not"); $email.addClass('error'); e = true; }
	else { this.checkEmail(email_trim); if ($email.hasClass('error')) e = true; }
	
	if (password_trim == "") { $password.addClass('error'); e = true; } else $password.removeClass('error');
	
	if (gender_trim == "0") { e = true; }
	
	return !e;
},
register: function(){
	if (!this.regValidate()) return;
	var self = this, output = {}, $f_register = $("#f_register"), inputs = $f_register.find("input,select").filter("[name]");
	$f_register.find("input,select").attr('disabled',true);
	$.map(inputs, function(n, i){
		output[n.name] = $.trim($(n).val());
	});
	$.post(aC.ajaxurl, {action:"register",form:output}, function(response){
		$f_register.find("input,select").attr('disabled',false);
		if (stringToBoolean(response.registered)) {
			$f_register.find("#b_register").removeClass('error');
			$f_register.clearForm();
			self.registered();
		} else {
			$f_register.find("#b_register").addClass('error');
		}
	});
},
registered: function(){
	alert("An activation link has been sent to your email (not really). You may now login.");
	$("#b_login").click();
},
checkEmail: function(email){
	email = $.trim(email);
	if (email != "") {
		$.get(this.ajaxurl, {action:"checkemail",email:email}, function(response){
			if (stringToBoolean(response.email)) $("#reg_email").addClass('error');
			else $("#reg_email").removeClass('error');
		});
	} else $("#reg_email").addClass('error');
},
onKeyDown: function(e){
	var keyCode = e.which;
	if (this.logged === false) {
		if (keyCode == keys.ENTER) {
			if (this.loginFocus) this.login();
			else if (this.registerFocus) this.register();
			e.preventDefault();
		}
	}
},
onWindowScroll: function(){
	if (this.moreUpdates) {
		if ($(window).scrollTop() + $(window).height() > $(document).height() - 100) {
			// load more updates when campus feed or global feed is active
		}
	}
},
postFlirt: function(){
	var self = this, e = false,
		$f_postflirt = $("#f_postflirt");
		$alias = $f_postflirt.find("#postflirt_alias"),
		$location = $f_postflirt.find("#postflirt_location"),
		$datetime = $f_postflirt.find("#postflirt_datetime"),
		$gender = $f_postflirt.find("#postflirt_gender").find("input:radio"),
		$gender_checked = gender.find(":checked"),
		$message = $f_postflirt.find("#postflirt_message");
	
	if ($.trim($alias.val()) == "") { $alias.addClass('error'); e = true; } else $alias.removeClass('error');
	if ($.trim($location.val()) == "") { $location.addClass('error'); e = true; } else $location.removeClass('error');
	if ($.trim($datetime.val()) == "") { $datetime.addClass('error'); e = true; } else $datetime.removeClass('error');
	if ($.trim($message.val()) == "") { $message.addClass('error'); e = true; } else $message.removeClass('error');
	if (typeof $gender_checked.val() == "undefined") { e = true; }
	
	if (!e) {
		$f_postflirt.find("input,select").attr('disabled',true);
		var output = {}, inputs = $f_postflirt.find("input").not(":radio").filter("[name]");
		$.map(inputs, function(n, i){
			output[n.name] = $.trim($(n).val());
		});
		output.gender = $gender_checked.val();
		$.post(this.ajaxurl, {action:"postflirt",form:output}, function(response){
			$f_postflirt.find("input,select").attr('disabled',false);
			if (stringToBoolean(response.posted)) {
				$f_postflirt.find("input.error").removeClass('error').end().clearForm();
				$datetime.datepicker("setDate", null);
				$gender.attr("checked", false).button("refresh");
				// prepend post to campus feed and global feed (or will it load it automatically)
			} else {
				$f_postflirt.find("#b_postflirt").addClass('error');
			}
		});
	}
},
addNewPost: function(){
	
},
addPosts: function(data){
	var s = '', action = "global",
		boy = '<span class="boygender">b</span>',
		girl = '<span class="girlgender">g</span>';
	
	$.each(data,function(i,v){
		var datetime = new Date(parseInt(v.timespotted+'000',10)),
			hours = datetime.getHours(),
			prefix = "AM",
			minutes = datetime.getMinutes(),
			seconds = datetime.getSeconds();
		if (hours > 12) { hours = hours - 12; prefix = "PM"; }
		else if (hours == 0) hours = 12;
		if (minutes < 10) { minutes = '0'+minutes; }
		var monthArray = ['January','February','March','April','May','June','July','August','September','October','November','December'],
			monthShortArray = ['Jan','Feb','Mar','Apr','May','June','July','Aug','Sept','Oct','Nov','Dec'],
			dayArray = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
			dayShortArray = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],
			time = hours + ":" + minutes + " " + prefix,
			timeordate = '';
		if (today(datetime)) {
			timeordate = '<span class="posttime">'+time+'</span>';
		} else if (yesterday(datetime)) {
			timeordate = '<span class="posttime">Yesterday ' + time+'</span>';
		} else {
			var date = dayShortArray[datetime.getDay()] + ", " + monthShortArray[datetime.getMonth()] + " " + datetime.getDate() + ", " + datetime.getFullYear();
			timeordate = '<span class="posttime">'+time+'</span> on <span class="postdate">'+date+'</span>';
		}
		s += '<li class="feedItem">';
		s += '<div class="postWrapper">';
		s += '<div class="gendersymbols">';
		if (v.ownergender == "Male") s += boy;
		else s += girl;
		s += '<span class="arrowgender">&rarr;</span>';
		if (v.theirgender == "Male") s += boy;
		else s += girl;
		s += '</div>';
		s += '<div class="posthead">';		
		s += 'hey <span class="postgender">';
		if (v.theirgender == "Male") s += 'boy';
		else s += 'girl';
		s += '</span> in <span class="postlocation">'+stripSlashes(v.location)+'</span> around ';
		s += timeordate;
		s += '</div>';
		s += '<div class="postbody">'+stripSlashes(v.message)+'</div>';
		s += '<div class="postalias">';
		if (action == "global") s += '<span class="postcampus-link link">'+v.campus.toUpperCase()+'</span> ';
		s += '- <span class="alias">'+stripSlashes(v.alias)+'</span></div>';
		s += '<div class="postactions">';
		s += '<span class="commentaction-link link">comment</span> - <span class="messageaction-link link">message</span> - <span class="reportaction-link link">report</span>';
		s += '</div>';
		s += '</div>';
		s += '</li>';
	});
	return s;
},
loadCampusFeed: function(){
	var self = this;
	$.getJSON(this.ajaxurl, {action:"feed"}, function(response){
		if (response.data !== false) {
			var s = self.addPosts(response.data);
			$("#campusfeedlist").append(s);
		}
	});
},
loadGlobal: function(){
	var self = this;
	$.getJSON(this.ajaxurl, {action:"global"}, function(response){
		if (response.data !== false) {
			var s = self.addPosts(response.data);
			$("#globalfeedlist").append(s);
		}
	});
},
loadMyPosts: function(){
	var self = this;
	$.getJSON(this.ajaxurl, {action:"myposts"}, function(response){
		if (response.data !== false) {
			var s = "";
		}
	});
},
loadMessages: function(){
	var self = this;
	$.getJSON(this.ajaxurl, {action:"messages"}, function(response){
		if (response.data !== false) {
			var s = "";
		}
	});
},
addPreviewPosts: function(data){
	var s = '';
	$.each(data,function(i,v){
		var datetime = new Date(parseInt(v.timespotted+'000',10)),
			hours = datetime.getHours(),
			prefix = "AM",
			minutes = datetime.getMinutes(),
			seconds = datetime.getSeconds();
		if (hours > 12) { hours = hours - 12; prefix = "PM"; }
		else if (hours == 0) hours = 12;
		if (minutes < 10) { minutes = '0'+minutes; }
		var monthArray = ['January','February','March','April','May','June','July','August','September','October','November','December'],
			monthShortArray = ['Jan','Feb','Mar','Apr','May','June','July','Aug','Sept','Oct','Nov','Dec'],
			dayArray = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
			dayShortArray = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],
			time = hours + ":" + minutes + " " + prefix,
			timeordate = '';
		if (today(datetime)) {
			timeordate = '<span class="posttime">'+time+'</span>';
		} else if (yesterday(datetime)) {
			timeordate = '<span class="posttime">Yesterday ' + time+'</span>';
		} else {
			var date = dayShortArray[datetime.getDay()] + ", " + monthShortArray[datetime.getMonth()] + " " + datetime.getDate() + ", " + datetime.getFullYear();
			timeordate = '<span class="posttime">'+time+'</span> on <span class="postdate">'+date+'</span>';
		}
		s += '<li class="feedItem">';
		s += '<div class="postWrapper">';
		s += '<div class="posthead">';
		s += 'hey <span class="postgender">';
		if (v.theirgender == "Male") s += 'boy';
		else s += 'girl';
		s += '</span> in <span class="postlocation">'+stripSlashes(v.location)+'</span> around ';
		s += timeordate;
		s += '</div>';
		s += '<div class="postbody">'+stripSlashes(v.message)+'</div>';
		s += '<div class="postalias"><span class="postcampus">'+v.campus.toUpperCase()+'</span> - <span class="alias">'+stripSlashes(v.alias)+'</span></div>';
		s += '</div>';
		s += '</li>';
	});
	return s;
},
loadPreviewFeed: function(){
	var self = this;
	$.getJSON(this.ajaxurl, {action:"preview"}, function(response){
		if (response.data !== false) {
			self.previewFeed = response.data;
			self.previewFeedIntervalId = window.setInterval(function(){ self.handlePreviewFeed(); }, 6000);
			self.handlePreviewFeed();
		}
	});
},
handlePreviewFeed: function(){
	var $previewfeedlist = $("#previewfeedlist");
	if ($previewfeedlist.children().length) {
		var s = this.addPreviewPosts(this.previewFeed.slice(this.previewFeedIndex++,this.previewFeedIndex));
		$previewfeedlist.children("li").first().slideUp(800,function(){ $(this).remove(); });
		$previewfeedlist.children("li").last().slideDown(800,function(){ $previewfeedlist.append(s); });
		if (this.previewFeedIndex === this.previewFeed.length) this.previewFeedIndex = 0;
	} else {
		var s = this.addPreviewPosts(this.previewFeed.slice(0,4));
		$previewfeedlist.append(s);
		this.previewFeedIndex = 4;
	}
},
dom: function(){
	var self = this;
	$(document).on({
		focus: function(){
			console.log("focus");
			self.loginFocus = true;
		},
		blur: function(){
			console.log("blur");
			self.loginFocus = false;
		}
	},'#lemail, #lpassword');
	$(document).on('click','#b_login_splash',function(){
		self.login();
	});
	$(document).on('click','#b_register_splash',function(){
		$("#register").show();
		$("#login").hide();
	});
	$(document).on({
		focus: function(){
			console.log("focus");
			self.registerFocus = true;
		},
		blur: function(){
			console.log("blur");
			self.registerFocus = false;
		}
	},'#reg_name, #reg_email, #reg_password');
	$(document).on('blur','#reg_email',function(){
		self.checkEmail(this.value);
	});
	$(document).on('click','#b_register',function(){
		self.register();
	});
	$(document).on('click','#b_login',function(){
		$("#login").show();
		$("#register").hide();
	});
	$(document).on('click','.post-link',function(){
		self.setPanel('post');
	});
	$(document).on('click','.myposts-link',function(){
		self.setPanel('myposts');
		self.loadMyPosts();
	});
	$(document).on('click','.messages-link',function(){
		self.setPanel('messages');
	});
	$(document).on('click','.campusfeed-link',function(){
		self.setPanel('campusfeed');
	});
	$(document).on('click','.global-link',function(){
		self.setPanel('global');
	});
	$(document).on('click','.logout-link',function(){
		self.logout();
	});
	$(document).on('click','.postcampus-link',function(){
		
	});
	$(document).on('click','.commentaction-link',function(){
		
	});
	$(document).on('click','.messageaction-link',function(){
		
	});
	$(document).on('click','.reportaction-link',function(){
		
	});
	$(document).on('click','#b_postflirt',function(){
		self.postFlirt();
	});
}
};

$(window).scroll(function(){window.aC.onWindowScroll()});
$(document.documentElement).keydown(function(e){window.aC.onKeyDown(e)});
$(document).ready(function(){window.aC.init()});

return true;
}
})(this, this.document, this.jQuery);