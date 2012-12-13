<?php
session_start();

require_once 'config.inc.php';
require_once 'functions.inc.php';
require_once 'mysql.class.php';

if (!$con = mysql_connect(MYSQL_HOST,MYSQL_USER,MYSQL_PASSWORD)) throw new Exception('Error connecting to the server');
if (!mysql_select_db(MYSQL_DATABASE,$con)) throw new Exception('Error selecting database');

switch ($_SERVER['REQUEST_METHOD']) {
case 'POST': $_REQ = $_POST; break;
case 'GET': $_REQ = $_GET; break;
default: $_REQ = $_GET; break;
}

setglobal($_REQ);

switch ($_SERVER['REQUEST_METHOD']) {
case 'POST':
if ($ACTION == 'login') {
	$VARS = array_map('varcheck',$FORM);
	if ($VARS['formname'] != 'login') print_json(array('logged'=>false));
	else unset($VARS['formname']);
	if (!validateinput($VARS,array('email','password'))) print_json(array('logged'=>false));
	extract($VARS);
	try {
		$db = new MySQL();
		$db->sfquery(array('SELECT * FROM campusflirt_login u JOIN campusflirt_info i ON u.user_id = i.user_id WHERE email = "%s" AND pass = PASSWORD("%s") LIMIT 1',$email,$password));		
		if ($db->numRows() == 1) {
			$row = $db->fetchAssocRow();
			$_SESSION['logged'] = true;
			$_SESSION['user_id'] = $row['user_id'];
			$_SESSION['email'] = $row['email'];
			$_SESSION['access_level'] = $row['access_level'];
			$_SESSION['last_login'] = $row['last_login'];
			$_SESSION['campus'] = $row['campus'];
			if (varcheck($row['middlename'],true)) $_SESSION['fullname'] = $row['firstname'] . ' ' . $row['middlename'] . ' ' . $row['lastname'];
			else $_SESSION['fullname'] = $row['firstname'] . ' ' . $row['lastname'];
			$_SESSION['firstname'] = $row['firstname'];
			if (varcheck($row['middlename'],true)) $_SESSION['middlename'] = $row['middlename'];
			$_SESSION['lastname'] = $row['lastname'];
			$last_login = date('Y-m-d');
			$logins = $row['logins']+1;
			$db->sfquery(array('UPDATE `%s` SET last_login = "%s", logins = "%s" WHERE user_id = %s','login',$last_login,$logins,$_SESSION['user_id']));
			print_json(array('logged'=>true));
		} else print_json(array('logged'=>false));
	} catch(Exception $e) {
		echo $e->getMessage();
		exit();
	}
} elseif ($ACTION == 'register') {
	$VARS = array_map('varcheck',$FORM);
	if ($VARS['formname'] != 'register') print_json(array('registered'=>false));
	else unset($VARS['formname']);
	$required = array('name','email','password','gender');
	if (!validateinput($VARS,$required)) print_json(array('logged'=>false));
	extract($VARS);
	list($firstname, $middlename, $lastname) = split(' ',ucname($name));
	if (!isset($lastname)) { $lastname = $middlename; $middlename = ''; }
	if (isEduEmail($email)) $campus = getCampusFromEmail($email);
	else print_json(array('registered'=>false));
	try {
		$db = new MySQL();
		$db->insert('campusflirt_login', array(
			'email'=>$email,
			'access_level'=>1,
			'last_login'=>date('Y-m-d'),
			'date_joined'=>date('Y-m-d'),
			'logins'=>0
		));
		if ($db->affectedRows() == 1) {
			$user_id = $db->insertID();
			$db->query('UPDATE campusflirt_login SET pass = PASSWORD("'.mysql_real_escape_string($password).'") WHERE user_id = '.$user_id);
			$db->insert('campusflirt_info', array(
				'user_id'=>$user_id,
				'campus'=>$campus,
				'firstname'=>$firstname,
				'middlename'=>$middlename,
				'lastname'=>$lastname,
				'gender'=>$gender
			));
			$user_id=1;
			$alias="myalias";
			$location="UL";
			$timespotted=mktime(4, 30, 0, 12, 11, 2012);
			$theirgender="Female";
			$message="You have your hoodie on in the UL Basement. Take it off and talk to me.";
			$timestamp=mktime(4, 35, 0, 12, 11, 2012);
			$db->insert('campusflirt_posts', array(
				'owner_id'=>$user_id,
				'campus'=>$campus,
				'alias'=>$alias,
				'location'=>$location,
				'timespotted'=>$timespotted,
				'theirgender'=>$theirgender,
				'message'=>$message,
				'timestamp'=>$timestamp,
				'reports'=>0
			));
			$flirt_id=1;
			$receiver_id=2;
			$sender_id=1;
			$privatemessage="hey i think you're cute too!";
			$timesent=mktime(4, 40, 0, 12, 11, 2012);
			$db->insert('campusflirt_messages', array(
				'flirt_id'=>$flirt_id,
				'receiver_id'=>$receiver_id,
				'sender_id'=>$sender_id,
				'privatemessage'=>$privatemessage,
				'timesent'=>$timesent
			));
			if ($db->affectedRows() == 1) print_json(array('registered'=>true));
			else print_json(array('registered'=>false));
		} else print_json(array('registered'=>false));
	} catch(Exception $e) {
		echo $e->getMessage();
		exit();
	}
} elseif ($ACTION == 'logout') {
	logout();
	print_json(array('logged'=>false));
}
break;
case 'GET':
if ($ACTION == 'logged') {
	if (isset($_SESSION['logged'])) print_json(array('logged'=>true),true);
	else print_json(array('logged'=>false),true);
} elseif ($ACTION == 'checkemail') {
	try {
		$db = new MySQL();
		$db->query('SELECT email FROM campusflirt_login WHERE email = "'.$EMAIL.'" LIMIT 1');
		if ($db->numRows() == 1) print_json(array('email'=>true),true);
		else print_json(array('email'=>false),true);
	} catch(Exception $e) {
		echo $e->getMessage();
		exit();
	}
} elseif ($ACTION == 'userdata') {
	varcheck($UID,true,$_SESSION['user_id'],'uid');
	try {
		$db = new MySQL();
		$db->query('SELECT u.user_id,u.email,i.campus,i.firstname,i.middlename,i.lastname FROM (campusflirt_login u JOIN campusflirt_info i ON u.user_id = i.user_id) WHERE u.user_id = '.$UID.' LIMIT 1');
		if ($db->numRows() == 1) {
			header('Content-Type: application/json; charset=utf8');
			print_json(array('user'=>$db->fetchAssocRow()));
		} else print_json(array('user'=>false),true);
	} catch(Exception $e) {
		echo $e->getMessage();
		exit();
	}
}
break;
}

exit();
?>