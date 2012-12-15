window.$ && main() || (function(){
	var j = document.createElement("script");
	j.setAttribute("type","text/javascript");
	j.setAttribute("src","jquery.js");
	j.onload = main;
	j.onreadystatechange = function(){
		if (this.readyState == "complete" || this.readyState == "loaded") main();
	};
	(document.getElementsByTagName("head")[0] || document.documentElement).appendChild(j);
})();

function main(){
if (main.run) return;
else main.run = true;

window.aC = {
title: "HnS Campus Flirt",
ajaxurl: "ajax.php",
loaded: false,
logged: false,
loginFocus: false,
registerFocus: false,
currentPanel: "",
moreUpdates: false, // change to true
panels: ['post','myposts','messages','campusfeed','browse'],
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
			self.loadBrowse();
			self.loadMyPosts();
			self.loadMessages();
			self.previewFeed = [];
			$("#previewfeedlist").empty();
			if (0 < self.previewFeedIntervalId) {
				window.clearInterval(previewFeedIntervalId);
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
	var self = this, e = false, email = $("#lemail"), password = $("#lpassword");
	if ($.trim(email.val()) == "") { email.addClass('error'); e = true; } else email.removeClass('error');
	if ($.trim(password.val()) == "") { password.addClass('error'); e = true; } else password.removeClass('error');
	if (!e) {
		$("#f_login").find("input,select").attr('disabled',true);
		var output = {}, inputs = $("#f_login").find("input").filter("[name]");
		$.map(inputs, function(n, i){
			output[n.name] = $.trim($(n).val());
		});
		$.post(this.ajaxurl, {action:"login",form:output}, function(response){
			$("#f_login").find("input,select").attr('disabled',false);
			if (stringToBoolean(response.logged)) {
				$("#reg_name, #reg_email, #reg_password").removeClass('error');
				$("#b_login_splash").removeClass('error');
				$("#f_register").clearForm();
				$("#f_login").clearForm();
				self.logged = true;
				self.loggedIn();
			} else {
				$("#b_login_splash").addClass('error');
				$("#lpassword").val('');
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
	name = $("#reg_name"), name_trim = $.trim(name.val()),
	email = $("#reg_email"), email_trim = $.trim(email.val()),
	password = $("#reg_password"), password_trim = $.trim(password.val()),
	gender = $("#reg_gender"), gender_trim = $.trim(gender.val()),
	nameReg = /[A-Za-z'-]/,
	emailReg = /^[^0-9][a-zA-Z0-9_]+([.][a-zA-Z0-9_]+)*[@][a-zA-Z0-9_]+([.][a-zA-Z0-9_]+)*[.][a-zA-Z]{2,4}?$/i,
	eduEmailReg = /^[^@  ]+@([a-zA-Z0-9\-]+\.)+([a-zA-Z0-9\-]{2}|edu)\$/;

	if (name_trim == "") { name.addClass('error'); e = true; }
	else if (!nameReg.test(name_trim)) { name.addClass('error'); e = true; }
	else if (name_trim.split(' ').length < 2) { name.addClass('error'); e = true; } else name.removeClass('error');

	if (email_trim == "") { email.addClass('error'); e = true; }
	else if (!emailReg.test(email_trim)) { email.addClass('error'); e = true; }
	else if (!strrchr(email_trim, ".") === ".edu") { alert("not"); email.addClass('error'); e = true; }
	else { this.checkEmail(email_trim); if (email.hasClass('error')) e = true; }
	
	if (password_trim == "") { password.addClass('error'); e = true; } else password.removeClass('error');
	
	if (gender_trim == "0") { e = true; }
	
	return !e;
},
register: function(){
	if (!this.regValidate()) return;
	$("#f_register").find("input,select").attr('disabled',true);
	var self = this, output = {}, inputs = $("#f_register").find("input,select").filter("[name]");
	$.map(inputs, function(n, i){
		output[n.name] = $.trim($(n).val());
	});
	$.post(aC.ajaxurl, {action:"register",form:output}, function(response){
		$("#f_register").find("input,select").attr('disabled',false);
		if (stringToBoolean(response.registered)) {
			$("#b_register").removeClass('error');
			$("#f_register").clearForm();
			self.registered();
		} else {
			$("#b_register").addClass('error');
		}
	});
},
registered: function(){
	alert("An activation link has been sent to your email.");
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
			// load more updates when campus feed or browse is active
		}
	}
},
postFlirt: function(){
	var self = this, e = false,
		alias = $("#postflirt_alias"),
		location = $("#postflirt_location"),
		datetime = $("#postflirt_datetime"),
		gender = $("#postflirt_gender :radio:checked"),
		message = $("#postflirt_message");
	
	if ($.trim(alias.val()) == "") { alias.addClass('error'); e = true; } else alias.removeClass('error');
	if ($.trim(location.val()) == "") { location.addClass('error'); e = true; } else location.removeClass('error');
	if ($.trim(datetime.val()) == "") { datetime.addClass('error'); e = true; } else datetime.removeClass('error');
	if ($.trim(message.val()) == "") { message.addClass('error'); e = true; } else message.removeClass('error');
	if (typeof gender.val() == "undefined") { e = true; }
	
	if (!e) {
		$("#f_postflirt").find("input,select").attr('disabled',true);
		var output = {}, inputs = $("#f_postflirt").find("input").not(":radio").filter("[name]");
		$.map(inputs, function(n, i){
			output[n.name] = $.trim($(n).val());
		});
		output.gender = $("#postflirt_gender :radio:checked").val();
		$.post(this.ajaxurl, {action:"postflirt",form:output}, function(response){
			$("#f_postflirt").find("input,select").attr('disabled',false);
			if (stringToBoolean(response.posted)) {
				$("#f_postflirt").find("input.error").removeClass('error').end().clearForm();
				$("#f_postflirt #postflirt_datetime").datepicker("setDate", null);
				$("#f_postflirt #postflirt_gender :radio").attr("checked", false).button("refresh");
				// prepend post to campus feed and global feed (or will it load it automatically)
			} else {
				$("#b_postflirt").addClass('error');
			}
		});
	}
},
addNewPost: function(){
	
},
addPosts: function(data){
	var s = '', action = "browse",
		boy = '<span class="boygender">b</span>',
		girl = '<span class="girlgender">g</span>';
	
	$.each(data,function(i,v){
		var datetime = new Date(parseInt(v.timespotted+'000',10)), hours = datetime.getHours(), prefix = "AM", minutes = datetime.getMinutes(), seconds = datetime.getSeconds();
		if (hours > 12) { hours = hours - 12; prefix = "PM"; }
		else if (hours == 0) hours = 12;
		if (minutes < 10) { minutes = '0'+minutes; }
		var monthArray = ['January','February','March','April','May','June','July','August','September','October','November','December'];
		var monthShortArray = ['Jan','Feb','Mar','Apr','May','June','July','Aug','Sept','Oct','Nov','Dec'];
		var dayArray = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
		var dayShortArray = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
		var time = hours + ":" + minutes + " " + prefix;
		var timeordate = '';
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
		s += '</span> in <span class="postlocation">'+v.location+'</span> around ';
		s += timeordate;
		s += '</div>';
		s += '<div class="postbody">'+v.message+'</div>';
		s += '<div class="postalias">';
		if (action == "browse") s += '<span class="postcampus-link link">'+v.campus.toUpperCase()+'</span> ';
		s += '- <span class="alias">'+v.alias+'</span></div>';
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
loadBrowse: function(){
	var self = this;
	$.getJSON(this.ajaxurl, {action:"browse"}, function(response){
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
		var datetime = new Date(parseInt(v.timespotted+'000',10)), hours = datetime.getHours(), prefix = "AM", minutes = datetime.getMinutes(), seconds = datetime.getSeconds();
		if (hours > 12) { hours = hours - 12; prefix = "PM"; }
		else if (hours == 0) hours = 12;
		if (minutes < 10) { minutes = '0'+minutes; }
		var monthArray = ['January','February','March','April','May','June','July','August','September','October','November','December'];
		var monthShortArray = ['Jan','Feb','Mar','Apr','May','June','July','Aug','Sept','Oct','Nov','Dec'];
		var dayArray = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
		var dayShortArray = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
		var time = hours + ":" + minutes + " " + prefix;
		var timeordate = '';
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
		s += '</span> in <span class="postlocation">'+v.location+'</span> around ';
		s += timeordate;
		s += '</div>';
		s += '<div class="postbody">'+v.message+'</div>';
		s += '<div class="postalias"><span class="postcampus">'+v.campus.toUpperCase()+'</span> - <span class="alias">'+v.alias+'</span></div>';
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
	if (0 < $("#previewfeedlist").children().length) {
		var s = this.addPreviewPosts(this.previewFeed.slice(this.previewFeedIndex++,this.previewFeedIndex));
		$("#previewfeedlist").children("li:first").slideUp(800,function(){ $(this).remove(); });
		$("#previewfeedlist").children("li:last").slideDown(800,function(){ $("#previewfeedlist").append(s); });
		if (this.previewFeedIndex === this.previewFeed.length) this.previewFeedIndex = 0;
	} else {
		var s = this.addPreviewPosts(this.previewFeed.slice(0,4));
		$("#previewfeedlist").append(s);
		this.previewFeedIndex = 4;
	}
},
dom: function(){
	var self = this;
	$("#lemail, #lpassword").live('focus',function(){
		self.loginFocus = true;
	}).live('blur',function(){
		self.loginFocus = false;
	});
	$("#b_login_splash").live('click',function(){
		self.login();
	});
	$("#b_register_splash").live('click',function(){
		$("#register").show();
		$("#login").hide();
	});
	$("#reg_name, #reg_email, #reg_password").live('focus',function(){
		self.registerFocus = true;
	}).live('blur',function(){
		self.registerFocus = false;
	});
	$("#reg_email").live('blur',function(){
		self.checkEmail(this.value);
	});
	$("#b_register").live('click',function(){
		self.register();
	});
	$("#b_login").live('click',function(){
		$("#login").show();
		$("#register").hide();
	});
	$(".post-link").live('click',function(){
		self.setPanel('post');
	});
	$(".myposts-link").live('click',function(){
		self.setPanel('myposts');
		self.loadMyPosts();
	});
	$(".messages-link").live('click',function(){
		self.setPanel('messages');
	});
	$(".campusfeed-link").live('click',function(){
		self.setPanel('campusfeed');
	});
	$(".browse-link").live('click',function(){
		self.setPanel('browse');
	});
	$(".logout-link").live('click',function(){
		self.logout();
	});
	$(".postcampus-link").live('click',function(){
		
	});
	$(".commentaction-link").live('click',function(){
		
	});
	$(".messageaction-link").live('click',function(){
		
	});
	$(".reportaction-link").live('click',function(){
		
	});
	$("#b_postflirt").live('click',function(){
		self.postFlirt();
	});
}
};

$(window).scroll(function(){window.aC.onWindowScroll()});
$(document.documentElement).keydown(function(e){window.aC.onKeyDown(e)});
$(document).ready(function(){window.aC.init()});

return true;
}