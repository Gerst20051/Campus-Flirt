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
			$_SESSION['fullname'] = $row['firstname'] . ' ' . $row['lastname'];
			$_SESSION['firstname'] = $row['firstname'];
			$_SESSION['lastname'] = $row['lastname'];
			$_SESSION['gender'] = $row['gender'];
			$last_login = date('Y-m-d');
			$logins = $row['logins']+1;
			$db->sfquery(array('UPDATE `%s` SET last_login = "%s", logins = "%s" WHERE user_id = %s','campusflirt_login',$last_login,$logins,$_SESSION['user_id']));
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
	if (!validateinput($VARS,$required)) print_json(array('registered'=>false));
	extract($VARS);
	list($firstname, $lastname) = split(' ',ucname($name));
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
				'lastname'=>$lastname,
				'gender'=>$gender
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
} elseif ($ACTION == 'postflirt') {
	$VARS = array_map('varcheck',$FORM);
	if ($VARS['formname'] != 'postflirt') print_json(array('posted'=>false));
	else unset($VARS['formname']);
	$required = array('alias','location','datetime','gender','message');
	if (!validateinput($VARS,$required)) print_json(array('posted'=>false));
	extract($VARS);
	$pd = date_parse($datetime);
	$timespotted = mktime($pd['hour'], $pd['minute'], $pd['second'], $pd['month'], $pd['day'], $pd['year']);
	$timestamp = time();
	$comments=json_encode(array(array("user_id"=>1,"gender"=>"Male","timestamp"=>$timespotted,"data"=>"comment 1"),array("user_id"=>2,"gender"=>"Male","timestamp"=>$timestamp,"data"=>"comment 2")));
	$comments="";
	try {
		$db = new MySQL();
		$db->insert('campusflirt_posts', array(
			'owner_id'=>$_SESSION['user_id'],
			'ownergender'=>$_SESSION['gender'],
			'campus'=>$_SESSION['campus'],
			'alias'=>$alias,
			'location'=>$location,
			'timespotted'=>$timespotted,
			'theirgender'=>$gender,
			'message'=>$message,
			'timestamp'=>$timestamp,
			'comments'=>$comments,
			'reports'=>0
		));
		if ($db->affectedRows() == 1) print_json(array('posted'=>true));
		else print_json(array('posted'=>false));
	} catch(Exception $e) {
		echo $e->getMessage();
		exit();
	}
} elseif ($ACTION == 'message') {
	/*
	$VARS = array_map('varcheck',$FORM);
	if ($VARS['formname'] != 'message') print_json(array('messaged'=>false));
	else unset($VARS['formname']);
	$required = array('senderalias','privatemessage');
	if (!validateinput($VARS,$required)) print_json(array('messaged'=>false));
	extract($VARS);
	*/
	try {
		$db = new MySQL();
		$flirt_id=1; //$FLIRTID
		$receiver_id=2; //#RECEIVERID
		$sender_id=$_SESSION['user_id'];
		$senderalias="mysendalias";
		$privatemessage="hey i think you're cute too!";
		$timesent=time();
		$db->insert('campusflirt_messages', array(
			'flirt_id'=>$flirt_id,
			'receiver_id'=>$receiver_id,
			'sender_id'=>$sender_id,
			'senderalias'=>$senderalias,
			'privatemessage'=>$privatemessage,
			'timesent'=>$timesent
		));
	} catch(Exception $e) {
		echo $e->getMessage();
		exit();
	}
} elseif ($ACTION == 'comment') {
	try {
		$db = new MySQL();
	} catch(Exception $e) {
		echo $e->getMessage();
		exit();
	}
}
break;
case 'GET':
if ($ACTION == 'logged') {
	if (isset($_SESSION['logged'])) print_json(array('logged'=>true));
	else print_json(array('logged'=>false));
} elseif ($ACTION == 'checkemail') {
	try {
		$db = new MySQL();
		$db->query('SELECT email FROM campusflirt_login WHERE email = "'.mysql_real_escape_string($EMAIL).'" LIMIT 1');
		if ($db->numRows() == 1) print_json(array('email'=>true));
		else print_json(array('email'=>false));
	} catch(Exception $e) {
		echo $e->getMessage();
		exit();
	}
} elseif ($ACTION == 'userdata') {
	//varcheck($UID,true,$_SESSION['user_id'],'uid');
	try {
		$db = new MySQL();
		$db->query('SELECT u.user_id,u.email,i.campus,i.firstname,i.lastname FROM (campusflirt_login u JOIN campusflirt_info i ON u.user_id = i.user_id) WHERE u.user_id = '.$_SESSION['user_id'].' LIMIT 1');
		if ($db->numRows() == 1) {
			header('Content-Type: application/json; charset=utf8');
			print_json(array('user'=>$db->fetchAssocRow()));
		} else print_json(array('user'=>false));
	} catch(Exception $e) {
		echo $e->getMessage();
		exit();
	}
} elseif ($ACTION == 'myposts') {
	try {
		$db = new MySQL();
		$db->query('SELECT * FROM campusflirt_posts WHERE owner_id = '.$_SESSION['user_id']);
		if (0 < $db->numRows()) {
			header('Content-Type: application/json; charset=utf8');
			print_json(array('data'=>$db->fetchAssocRows()));
		} else print_json(array('data'=>false));
	} catch(Exception $e) {
		echo $e->getMessage();
		exit();
	}
} elseif ($ACTION == 'messages') {
	try {
		$db = new MySQL();
		$db->query('SELECT * FROM campusflirt_messages WHERE receiver_id = '.$_SESSION['user_id'].' OR sender_id = '.$_SESSION['user_id']);
		if (0 < $db->numRows()) {
			header('Content-Type: application/json; charset=utf8');
			print_json(array('data'=>$db->fetchAssocRows()));
		} else print_json(array('data'=>false));
	} catch(Exception $e) {
		echo $e->getMessage();
		exit();
	}
} elseif ($ACTION == 'feed') {
	try {
		$db = new MySQL();
		$db->query('SELECT * FROM campusflirt_posts WHERE campus = \''.$_SESSION['campus'].'\' ORDER BY timestamp DESC');
		if (0 < $db->numRows()) {
			header('Content-Type: application/json; charset=utf8');
			print_json(array('data'=>$db->fetchAssocRows()));
		} else print_json(array('data'=>false));
	} catch(Exception $e) {
		echo $e->getMessage();
		exit();
	}
} elseif ($ACTION == 'browse') {
	try {
		$db = new MySQL();
		if (!check($CAMPUS)) {
			$db->query('SELECT * FROM campusflirt_posts ORDER BY timestamp DESC');
		} else {
			$db->query('SELECT * FROM campusflirt_posts WHERE campus = \''.mysql_real_escape_string($CAMPUS).'\' ORDER BY timestamp DESC');
		}
		if (0 < $db->numRows()) {
			header('Content-Type: application/json; charset=utf8');
			print_json(array('data'=>$db->fetchAssocRows()));
		} else print_json(array('data'=>false));
	} catch(Exception $e) {
		echo $e->getMessage();
		exit();
	}
} elseif ($ACTION == 'preview') {
	try {
		$db = new MySQL();
		$db->query('SELECT * FROM campusflirt_posts ORDER BY timestamp DESC LIMIT 30');
		if (0 < $db->numRows()) {
			header('Content-Type: application/json; charset=utf8');
			print_json(array('data'=>$db->fetchAssocRows()));
		} else print_json(array('data'=>false));
	} catch(Exception $e) {
		echo $e->getMessage();
		exit();
	}
}
break;
}

exit();
?>