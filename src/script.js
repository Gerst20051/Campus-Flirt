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
user: {},
handleHash: function(){
	if (Hash.getHash().length > 0) {
		Hash.parse();
	}
},
init: function(){
	if (this.loaded !== false) return;
	var self = this;
	$.getJSON(this.ajaxurl, {action:"logged"}, function(response){
		self.loaded = true;
		if (response.logged === true) self.logged = true;
		if (self.logged === true) self.loggedIn(); else self.loggedOut();
	});
	this.handleHash();
	this.dom();
},
loggedIn: function(){
	var self = this;
	if (this.logged === false) return;
	$.getJSON(this.ajaxurl, {action:"userdata"}, function(response){
		if (response.user !== false) {
			self.user = response.user;
			if (self.user.middlename != "") self.user.fullname = self.user.firstname+' '+self.user.middlename+' '+self.user.lastname;
			else self.user.fullname = self.user.firstname+' '+self.user.lastname;
		} else aC.logout();
	});
	$("#loggedin").show();
	$("#loggedout").hide();
	$("body").addClass("in").removeClass("out");
},
loggedOut: function(){
	$("#loggedout").show();
	$("#loggedin").hide();
	$("body").addClass("out").removeClass("in");
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
				$("#b_login_splash").removeClass('error');
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
		if (stringToBoolean(response.registered)) {
			$("#b_register").removeClass('error');
			$("#f_register").clearForm();
			self.registered();
		} else {
			$("#f_register").find("input,select").attr('disabled',false);
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
	$(".logout-link").live('click',function(){
		self.logout();
	});
}
};

$(document.documentElement).keydown(function(e){window.aC.onKeyDown(e)});
$(document).ready(function(){window.aC.init()});

return true;
}