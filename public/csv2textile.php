<?

define("VERSION","0.1.1");

function get_post($key,$def=NULL,$slashes=False) {
	$v= $_REQUEST[$key];
	if (!isset($v)) return $def;
	
	return adjust_slashes($v,$slashes);
}

function unslashify($value) {
	return adjust_slashes($value,False);
}

function adjust_slashes($v,$slashes) {
	if ($slashes and (get_magic_quotes_gpc()==0)) $v= addslashes($v);
	else if (!$slashes and (get_magic_quotes_gpc()==1)) $v= stripslashes($v);
	return $v;
}

#------------------------------------------------------------------------

define("EOL","\r\n");

function table_head($attr=NULL) {
	global $format;
	global $first;

	if ($attr) $s= " table$attr";
	if ($attr) $s.= ".";
	if ($attr) $s.= EOL;
	$s.= " |^.";
	$s.= EOL;
	$first = true;
	
	return $s;
}

function table_foot($attr=NULL) {
	global $format;
	return EOL;
}

function compose_cell($text,$break,$attr=NULL) {
	global $format;
	global $first;
	global $convert;

	if ($convert=="html" or $convert=="wp") $text= htmlspecialchars($text,ENT_NOQUOTES);
	if ($convert=="xhtml") $text= htmlspecialchars($text,ENT_QUOTES);
	if ($convert=="wp" and $format=="wp") {
		$text= preg_replace('(\[\[.*?\]\])','<nowiki>\0</nowiki>',$text);
		$text= preg_replace('(\{\{\{.*?\}\}\})','<nowiki>\0</nowiki>',$text);
		$text= preg_replace('(\{\{.*?\}\})','<nowiki>\0</nowiki>',$text);
		$text= preg_replace('(^\*)','<nowiki>\0</nowiki>',$text);
		$text= preg_replace('(^#)','<nowiki>\0</nowiki>',$text);
		$text= preg_replace('(^\{\|)','<nowiki>\0</nowiki>',$text);
		$text= preg_replace('($\|\})','<nowiki>\0</nowiki>',$text);
		$text= preg_replace('('."'''+".')','<nowiki>\0</nowiki>',$text);
		$text= preg_replace('('."''".')','<nowiki>\0</nowiki>',$text);
		$text= preg_replace('(~~~~+)','<nowiki>\0</nowiki>',$text);
		$text= preg_replace('(~~~)','<nowiki>\0</nowiki>',$text);
	}
	
	$text= str_replace("\r\n",$break,$text);
	$text= str_replace("\n\r",$break,$text);
	$text= str_replace("\n",$break,$text);
	$text= str_replace("\r",$break,$text);
	
	if ($format=="html") {
		$s= "\t\t<td $attr>";
		$s.= htmlspecialchars($text);
		$s.= "</td>".EOL;
	}
	else {
		if ($first) $s= " |_. ";
		if (!$first) $s= " |";
		if ($attr and !$first) $s.= "$attr. ";
		$s.= $text;
	}
	
	return $s;
}

function compose_row($row,$break,$attr=NULL) {
	global $format;
	global $first;
	
	if ($format=="html") $s.= "\t<tr>".EOL;
	foreach ($row as $cell) {
		$s.= compose_cell($cell,$break,$attr);
	}
	
	if ($format=="html") $s.= "\t</tr>".EOL;
	else {
		$s.= " |".EOL;
		if ($first) $s.= " |-. ".EOL;
		$first = false;
	}
	
	return $s;
}

function csv2wp($csv,$table_attr=NULL,$cell_attr=NULL) {
	global $no_quote_escape;

	$sep= $GLOBALS["separator"];
	$break= $GLOBALS["break"];
	$q_char= $GLOBALS["quotes"];
	$escape= $GLOBALS["escape"];
	
#	print "Parsing: separator:$sep; quotes:$q_char; escape:$escape; no-quote-escape:".(int)$no_quote_escape."; <br>";
	
	$nl_char= "\r\n";
	$ws_char= $nl_char."\t ";
	
	$wp= "";
	$wp.= table_head($table_attr);
	
	$buffer= "";
	$quote= "";
	$row= array();
	$cell= 0;
	$esc= False;
	
	$state= 0; #states: 0=break; 1=text; 3=quote; 4=quote-test;
	$i= 0;
	$len= strlen($csv);
	
	while ($i<=$len) {
		if ($i>=$len) $ch= NULL; #EOF
		else $ch= substr($csv,$i,1);
		
		$i+= 1;
		
		if ($esc) {
			#print "pos:$i; ch:$ch; state:$state ESC; cell:$cell; buffer:$buffer; <br>";
			$esc= False;
			$buffer.= $ch;
			continue;
		}
		
		#print "pos:$i; ch:$ch; state:$state; cell:$cell; buffer:$buffer; <br>";
		
		switch ($state) {
			case 0: #break
				if ($ch!==NULL and strpos($nl_char,$ch)===False and strpos($ws_char,$ch)===False) {
					$row= array();
					$i-= 1; #pushback!
					$state= 1; #text
				}
				break;
				
			case 1: #text
				if ($ch===NULL or strpos($nl_char,$ch)!==False) {
					$row[$cell]= $buffer;
					$cell= 0;
					$buffer= "";
					
					$state= 0; #break
				}
				else if ($ch==$escape) {
					$esc= True;
				}
				else if ($ch==$sep) {
					$row[$cell]= $buffer;
					$cell+= 1;
					$buffer= "";
					
					#next text
				}
				else if (strpos($q_char,$ch)!==False) {
					$quote= $ch;
					$state= 2; #quote
				}
				else $buffer.= $ch;
				break;
				
			case 2: #quote
				if ($ch==$quote) {
					if ($no_quote_escape) $state= 1; #text
					else $state= 3; #quote-test
				}
				else if ($ch==$escape) {
					$esc= True;
				}
				else if ($ch===NULL) { #Unexpected EOF inside Quote.
					$row[$cell]= $buffer;
					$cell= 0;
					$buffer= "";
					
					$state= 0; #break
				}
				else $buffer.= $ch;
				break;
				
			case 3: #quote-test
				if ($ch==$quote) { #double-quote (literal quote)
					$buffer.= $quote;
					$state= 2; #quote	
				}
				else if ($ch===NULL) { #EOF after closing Quote.
					$row[$cell]= $buffer;
					$cell= 0;
					$buffer= "";
					
					$state= 0; #break
				}
				else {
					$i-= 1; #pushback
					$state= 1; #text
				}
				break;
			default:
				$state= 0;
				$i-= 1;
		}
		
		if ($state==0 and $row) {
			$wp.= compose_row($row,$break,$cell_attr);
			$row= array();
		}
		
	}
	
	$wp.= table_foot();
	return $wp;
}

#------------------------------------------------------------------------
$run= False;
if (isset($_REQUEST["to_wp"])) {
	$format= "wp";
	$run= True;
}
else if (isset($_REQUEST["to_html"])) {
	$format= "html";
	$run= True;
}

if (isset($_REQUEST["download"])) {
	if ($format=="html" or $format=="xhtml") header("Content-Type: text/html");
	else header("Content-Type: text/plain");
	
	print get_post("wp");
	exit;
}

$csv= get_post("csv");

if (isset($_REQUEST["upload"])) {
	if (!isset($_FILES["file"])) $error= "No File to upload!";
	else {
		$f= $_FILES["file"];
		$enc= get_post("encoding");
		
		#print_r($_FILES);
		
		if ($f['error']==UPLOAD_ERR_OK) {
			$tmp= $f['tmp_name'];
			$csv= file_get_contents($tmp);
			if ($csv===False) $error= "Failed to load data from $tmp!";
			else {
				if ($enc and $enc!="UTF-8") {
					$txt= iconv($enc,"UTF-8",$csv);
					
					if ($txt===False) $error= "Conversion from $enc failed!";
					else $csv= $txt;
				}
			}
		}
		else $error= "Upload failed!";
	}
}

#------------------------------------------------------------------------
$separator= get_post("separator");
$break= get_post("break");
$convert= get_post("convert");
$escape= get_post("escape");
$quotes= get_post("quotes");

$no_quote_escape= isset($_REQUEST["no-quote-escape"]);

if (!isset($separator)) $separator= ",";
if (!isset($break)) $break= "SPACE";
if (!isset($convert)) $convert= "html";
if (!isset($escape)) $escape= "NONE";
if (!isset($quotes)) $quotes= "\"";

$checked= array(
	"separator-$separator" => "checked='checked'",
	"break-$break" => "checked='checked'",
	"convert-$convert" => "checked='checked'",
	"escape-$escape" => "checked='checked'",
	"quotes-$quotes" => "checked='checked'",
);

if ($no_quote_escape) $checked["no-quote-escape"]= "checked='checked'";

if ($separator == "TAB") $separator= "\t";
else if ($separator == "OTHER") $separator= get_post("other-separator");

if ($break == "SPACE") $break= " ";
else if ($break == "OTHER") $break= get_post("other-break");

if ($quotes == "NONE") $quotes= "";
else if ($quotes == "OTHER") $break= get_post("other-quotes");

if ($escape == "NONE") $escape= NULL;
else if ($escape == "OTHER") $escape= get_post("other-escape");

if (!isset($separator) or $separator=="") $separator= ",";
if (!isset($break) or $break=="") $break= " ";
if (!isset($escape) or $escape=="") $escape= NULL;
if (!isset($quotes)) $quotes= "\"";

$table_attr= get_post("table-attr");
$cell_attr= get_post("cell-attr");

$out_enc= get_post("output_encoding");
if (!$out_enc) $out_enc= "UTF-8";

if ($run) {
	$wp= csv2wp($csv,$table_attr,$cell_attr);
	
	if ($out_enc and $out_enc!="UTF-8") {
		$t= iconv("UTF-8",$out_enc."//TRANSLIT",$wp);
		
		if ($wp===False) $error= "Conversion to $out_enc failed!";
		else $wp= $t;
	}

	if (!$error) {
		if ($_REQUEST["binary"]) {
			header("Content-Type: application/octet-stream");
			$disp= "attachment";
		}
		else {
			if ($_REQUEST["preview"] and ($format=="html" or $format=="xhtml")) header("Content-Type: text/html; ".($out_enc?"charset=$out_enc":""));
			else header("Content-Type: text/plain; ".($out_enc?"charset=$out_enc":""));
			$disp= "";
		}
		
		if ($format=="html" or $format=="xhtml") $ext= ".html";
		else $ext= ".txt";

		$name= "csv2wp-".time().".$out_enc".$ext; 
		header("Content-Description: $name");
		if ($disp) header("Content-Disposition: $disp; filename=\"$name\"");
		
		print $wp;
		flush;
		exit;
	}
}
else {
	header("Content-Type: text/html; charset=UTF-8");
}

#------------------------------------------------------------------------
?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en" dir="ltr">

<head>
	<meta http-equiv="Cotent-Type" content="text/html;charset=utf-8" />
	<link rel="stylesheet" type="text/css" media="screen" href="http://txstyle.org/css/bootstrap3min.css" />
	<title>CSV Table to Textile Converter</title>
</head>

<body>

    <div class="container">
      <div class="row">
        <div class="col-md-10">

<h1><b>CSV Table to Textile Converter</b></h1>
<hr/>

<?
function print_charset_selector($name) {
?>
		<select name="<?=$name?>">
			<option value="UTF-8">UTF-8 (Unicode)</option>
			<option value="UTF-16">UTF-16 (Unicode)</option>
			<option value="ISO-8859-1">ISO-8859-1 (Latin-1)</option>
			<option value="ISO-8859-15">ISO-8859-15 (Extended Latin-1)</option>
			<option value="CP1250">CP-1250 (Windows: Central European)</option>
			<option value="MAC">MacRoman (Macintosh: Roman)</option>
			<option value="ASCII">ASCII (7 Bit)</option>
			<option value="">(do not convert)</option>
		</select>
<?
}
?>

<? if ($error): ?>
	<p style="text-align:center; font-size:110%; font-weight:bold; color:red;">ERROR: <?=$error?></p>
<? else: ?>
	<? if (isset($_REQUEST["upload"])): ?>
		<p style="text-align:center; font-size:110%; font-weight:bold; color:green;">Upload complete!</p>
	<? endif; ?>
	
	<? if ($run): ?>
		<p style="text-align:center; font-size:110%; font-weight:bold; color:green;">Conversion complete!</p>
		<p style="text-align:center; font-size:100%; font-weight:normal; color:green;">Look at the <a href="#result">box at the bottom</a> for the results.</p>
	<? endif; ?>
<? endif; ?>

<form accept-charset="utf-8" method="post" enctype="multipart/form-data" action="http://txstyle.org/csv2textile.php">

<p><b>This will convert your CSV data into Textile. The first line will be treated as the header.</b></p>

	<p><b>Enter CSV data here:</b><br/><br/>
	<textarea name="csv" 
		style="width:100%; background-color:#FAFAE0; border:1px solid silver;" 
		cols="80" rows="23" 
		><?=htmlspecialchars($csv)?></textarea>
	</p>

	<p style="text-align:left;">
		<input type="submit" name="to_wp" value="Convert to Textile!" style="font-size:120%; font-weight:bold;"/>
	</p>

<p><b>To convert data directly from Excel or Word, copy and paste table data, then select "TAB" below.<b/></p>
	
<hr/>

	<table cellspacing="24">
	<tr>
		<td valign="top"><br/><b>Separator Character: </b><br/>
			<input type="radio" name="separator" value="," <?=$checked["separator-,"]?>/>Comma (",") <br/>
			<input type="radio" name="separator" value=";" <?=$checked["separator-;"]?>/>Semicolon (";") <br/>
			<input type="radio" name="separator" value="|" <?=$checked["separator-|"]?>/>Pipe ("|") <br/>
			<input type="radio" name="separator" value=":" <?=$checked["separator-:"]?>/>Colon (":") <br/>
			<input type="radio" name="separator" value="#" <?=$checked["separator-#"]?>/>Octothorpe ("#") <br/>
			<input type="radio" name="separator" value="TAB" <?=$checked["separator-TAB"]?>/>TAB <br/>
			<input type="radio" name="separator" value="OTHER" <?=$checked["separator-OTHER"]?>/>Other: <input type="text" name="other-separator" size="3" maxlength="1" value="<?=htmlspecialchars(get_post("other-separator"),ENT_QUOTES)?>"/>
		</td>
		<td valign="top"><br/><b>Quotation Characters: </b><br/>
			<input type="radio" name="quotes" value="&quot;" <?=$checked["quotes-\""]?>/>Doubl-Quote ('&quot;') <br/>
			<input type="radio" name="quotes" value="&quot;&amp;" <?=$checked["quotes-:"]?>/>Quotes ('&quot;' and ''')<br/>
			<input type="radio" name="quotes" value="OTHER" <?=$checked["quotes-OTHER"]?>/>Other: <input type="text" name="other-separator" size="3" maxlength="6" value="<?=htmlspecialchars(get_post("other-quotes"),ENT_QUOTES)?>"/><br/>
			<input type="radio" name="quotes" value="NONE" <?=$checked["quotes-NONE"]?>/>None (use Escape-Character only) <br/>
			<br/>
			<input type="checkbox" name="no-quote-escape" <?=$checked["no-quote-escape"]?>/><label for="quote-escape">No traditional escaping by doubling quotes.</label>
		</td>
		<td valign="top"><br/><b>Escape Character: </b><br/>
			<input type="radio" name="escape" value="\" <?=$checked["escape-\\"]?>/>Backslash ("\") <br/>
			<input type="radio" name="escape" value="?" <?=$checked["escape-?"]?>/>Questionmark ("?") <br/>
			<input type="radio" name="escape" value="^" <?=$checked["escape-^"]?>/>Carat ("^") <br/>
			<input type="radio" name="escape" value="#" <?=$checked["escape-#"]?>/>Octothorpe ("#") <br/>
			<input type="radio" name="escape" value="OTHER" <?=$checked["escape-OTHER"]?>/>Other: <input type="text" name="other-escape" size="3" maxlength="1" value="<?=htmlspecialchars(get_post("other-escape"),ENT_QUOTES)?>"/><br/>
			<input type="radio" name="escape" value="NONE" <?=$checked["escape-NONE"]?>/>None (use Quoting only)<br/>
		</td>
	</tr>
	<tr>
		<td valign="top"><br/><b>Convert Linebreaks in Cells: </b><br/>
			<input type="radio" name="break" value="SPACE" <?=$checked["break-SPACE"]?>/>Replace with space <br/>
			<input type="radio" name="break" value="&lt;br&gt;" <?=$checked["break-<br>"]?>/>Replace with &lt;br&gt; <br/>
			<input type="radio" name="break" value="OTHER" <?=$checked["break-OTHER"]?>/>Replace with <input type="text" name="other-break" size="5" maxlength="16" value="<?=htmlspecialchars(get_post("other-break"),ENT_QUOTES)?>"/>
		</td>
		<td valign="top"><br/><b>Convert Special Characters: </b><br/>
			<input type="radio" name="convert" value="off" <?=$checked["convert-off"]?>/>Do not convert (table contains code)<br/>
			<input type="radio" name="convert" value="html" <?=$checked["convert-html"]?>/>Protect HTML-Special characters (but not quotes)<br/>
			<input type="radio" name="convert" value="xhtml" <?=$checked["convert-xhtml"]?>/>Protect XML-Special characters (including all quotes)<br/>
			<input type="radio" name="convert" value="wp" <?=$checked["convert-wp"]?>/>Protect WikiMedia constructs and HTML-Markup<br/>
		</td>
		<td valign="top"><br/><b>HTML-Attributes*: </b><br/>
			for the table: <input type="text" name="table-attr" size="32" maxlength="128" value="<?=htmlspecialchars(get_post("table-attr"),ENT_QUOTES)?>"/><br/>
			for each cell: <input type="text" name="cell-attr" size="32" maxlength="128" value="<?=htmlspecialchars(get_post("cell-attr"),ENT_QUOTES)?>"/>
		</td>
	</tr>
	</table>
	
	<!--<hr/>
	<p><a name="result"></a><b>Resulting WikiMedia Table:</b><br/>
		<textarea name="wp" cols="80" rows="23" style="width:100%; background-color:#F0F0F0; border:1px solid silver;" readonly="readonly"><?/*=htmlspecialchars($wp)*/?></textarea>
	</p>
	
	<p style="text-align:center;">
		<input type="submit" name="download" value="Show/Download Result" style="font-size:110%; font-weight:normal;"/>
	</p>
	-->
</form>

<hr/>

*Note: HTML-Attributes are written as CSS styles that are enclosed in curly
braces, such as {color:red}, or as CSS classes and IDs that are enclosed in
parentheses, such as (myclass).

<hr/>

<p style="font-size:80%; text-align:right;">cvs2textile is based on
<a href="http://area23.brightbyte.de/csv2wp.php">csv2wp</a> (c) 2004 by <a href="http://brightbyte.de">Daniel Kinzler</a>
</p>

        </div><!-- col-md-10-->
      </div><!-- row-->
    </div><!-- fluid-container-->

</body>

</html>
