<%
' This is Textile
' A Humane Web Text Generator

' The original Textile was written in PHP. The following is required by the
' license:
' Version 1.0
' 21 Feb, 2003

' Copyright (c) 2003, Dean Allen, www.textism.com
' All rights reserved.

' This is a port to VBScript by mmm-oshii@agresticism.org, copyright 2003. It
' most likely doesn't work as well, so only use it if you have to.

' _______
' LICENSE

' Redistribution and use in source and binary forms, with or without
' modification, are permitted provided that the following conditions are met:

' * Redistributions of source code must retain the above copyright notice,
'   this list of conditions and the following disclaimer.

' * Redistributions in binary form must reproduce the above copyright notice,
'   this list of conditions and the following disclaimer in the documentation
'   and/or other materials provided with the distribution.

' * Neither the name Textile nor the names of its contributors may be used to
'   endorse or promote products derived from this software without specific
'   prior written permission.

' THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
' AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
' IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
' ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE
' LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
' CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
' SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
' INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
' CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
' ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
' POSSIBILITY OF SUCH DAMAGE.

' _____________
' USING TEXTILE

' Block modifier syntax:

' Header: hn.
' Paragraphs beginning with 'hn. ' (where n is 1-6) are wrapped in header tags.
' Example: <h1>Text</h1>

' Header with CSS class: hn(class).
' Paragraphs beginning with 'hn(class). ' receive a CSS class attribute.
' Example: <h1 class="class">Text</h1>

' Paragraph: p. (applied by default)
' Paragraphs beginning with 'p. ' are wrapped in paragraph tags.
' Example: <p>Text</p>

' Paragraph with CSS class: p(class).
' Paragraphs beginning with 'p(class). ' receive a CSS class attribute.
' Example: <p class="class">Text</p>

' Blockquote: bq.
' Paragraphs beginning with 'bq. ' are wrapped in block quote tags.
' Example: <blockquote>Text</blockquote>

' Blockquote with citation: bq(citeurl).
' Paragraphs beginning with 'bq(citeurl). ' receive a citation attribute.
' Example: <blockquote cite="citeurl">Text</blockquote>

' Numeric list: #
' Consecutive paragraphs beginning with # are wrapped in ordered list tags.
' Example: <ol><li>ordered list</li></ol>

' Bulleted list: *
' Consecutive paragraphs beginning with * are wrapped in unordered list tags.
' Example: <ul><li>unordered list</li></ul>

'
' Phrase modifier syntax:

' _emphasis_             <em>emphasis</em>
' __italic__             <i>italic</i>
' *strong*               <strong>strong</strong>
' **bold**               <b>bold</b>
' ??citation??           <cite>citation</cite>
' -deleted text-         <del>deleted</del>
' +inserted text+        <ins>inserted</ins>
' ^superscript^          <sup>superscript</sup>
' ~subscript~            <sub>subscript</sub>
' @code@                 <code>computer code</code>

' ==notextile==          leave text alone (do not format)

' "linktext":url         <a href="url">linktext</a>
' "linktext(title)":url  <a href="url" title="title">linktext</a>

' !imageurl!             <img src="imageurl" />
' !imageurl(alt text)!   <img src="imageurl" alt="alt text" />
' !imageurl!:linkurl     <a href="linkurl"><img src="imageurl" /></a>

' ABC(Always Be Closing) <acronym title="Always Be Closing">ABC</acronym>

Public Function Textile(ByVal Text)
	' Declare variables. Boring, but I use Option Explicit.
	Dim RegExp
	Dim Line
	Dim QuickTags, OutputTags
	Dim GlyphSearch, GlyphReplace, CodePre
	Dim BlockSearch, BlockReplace, List, Pre
	Dim I, J

	' This object has to be passed to every regex function. I know, it's dumb.
	Set RegExp = New RegExp

	' Basic global changes.

	' Turn any incoming ampersands into a dummy character for now. This uses a negative lookahead for alphanumerics followed by a semicolon, implying an incoming HTML entity, to be skipped.
	Text = RegExpReplace(RegExp, Text, "&([#a-zA-Z0-9]+;)", "x%x%$1")

	' Entify everything.
	' Server.HTMLEncode is about the one thing this version has over the PHP original. And it's not even a VBScript function! (It's a method of the Server object provided by ASP.)
	Text = Server.HTMLEncode(Text)

	' Unentify angle brackets and ampersands.
	' And quotes.
	Text = Replace(Text, "&gt;", ">")
	Text = Replace(Text, "&lt;", "<")
	Text = Replace(Text, "&amp;", "&")
	Text = Replace(Text, "&quot;", """")

	' Sort out newlines.
	Text = RegExpReplace(RegExp, Text, "\r\n", vbNewLine)

	' Zap tabs.
	Text = Replace(Text, vbTab, "")

	' Get rid of space around each line.
	' Is this any quicker than doing a regex for \s*\n\s* and replacing it with \n?
	Text = Split(Text, vbNewLine)

	For I = 0 To UBound(Text)
		Text(I) = Trim(Text(I))
	Next

	' Put the pieces back together.
	Text = Join(Text, vbNewLine)

	' Find and replace quick tags.

	' Double equal signs means notextile.
	Text = RegExpReplace(RegExp, Text, "(^|\s)==(.*?)==(\s|$)?", "$1<notextile>$2</notextile>$3")

	' Image qtag.
	Text = RegExpReplace(RegExp, Text, "!([^\s\(=]+?)\s?(?:\(([^\)]+?)\))?!(\s)?", "<img src=""$1"" alt=""$2"" border=""0"" />$3")

	' Image with hyperlink.
	Text = RegExpReplace(RegExp, Text, "(<img.+ \/>):(\S+?)(\s)", "<a href=""$2"">$1</a>$3")

	' Hyperlink qtag.
	Text = RegExpReplace(RegExp, Text, """([^""\(]+)\s?(\(([^\)]+)\))?"":(\S+?)([^\w\s\/;]|[1-9]*?)(\s|$)", "<a href=""$4"" title=""$3"">$1</a>$5$6")

	' Qtag definitions.
	QuickTags  = Array("\*\*", "\*", "\?\?", "-", "\+", "~", "@")
	OutputTags = Array("b", "strong", "cite", "del", "ins", "sub", "code")

	' Loop through the arrays, replacing qtags with HTML.
	' Don't say you didn't see this coming.
	For J = 0 To UBound(QuickTags)
		Text = RegExpReplace(RegExp, Text, "(^|\s|>)" & QuickTags(J) & "\b(.+?)\b([^\w\s]*?)" & QuickTags(J) & "([^\w\s]{0,2})(\s|$)?", "$1<" & OutputTags(J) & ">$2$3</" & OutputTags(J) & ">$4$5")
	Next

	' Some weird BS with underscores and \b word boundaries, apparently.
	Text = RegExpReplace(RegExp, Text, "(^|\s)__(.*?)__([^\w\s]{0,2})(\s|$)?", "$1<i>$2</i>$3$4")
	Text = RegExpReplace(RegExp, Text, "(^|\s)_(.*?)_([^\w\s]{0,2})(\s|$)?", "$1<em>$2</em>$3$4")
	Text = RegExpReplace(RegExp, Text, "\^(.*?)\^", "<sup>$1</sup>")

	' Find and replace typographic chars and special tags.

	' Small problem with double quotes at the end of a string.
	' I don't know if VBScript requires this, but I guess it's not doing anybody any harm.
	Text = RegExpReplace(RegExp, Text, "/""$/", "\"" ")

	' NB: all these will wreak havoc inside HTML tags.
	' Single closing, single opening, double closing, double opening, ellipsis, 3+ uppercase acronym,  3+ uppercase caps, em dash, en dash, dimension sign, trademark, registered, copyright.
	GlyphSearch = Array("([^\s[{(>])?'([dmst]\b|ll\b|ve\b|\s|$)", "'", "([^\s[{(])?""(\s|$)", """", "\b( )?\.{3}", "\b([A-Z][A-Z0-9]{2,})\b(?:[(]([^)]*)[)])/i", "(^|[^""][>\s])([A-Z][A-Z0-9 ]{2,})([^<a-z0-9]|$)/i", "\s?--\s?", "\s-\s", "(\d+) ?x ?(\d+)", "\b ?[([]TM[])]/i", "\b ?[([]R[])]/i", "\b ?[([]C[])]/i")

	GlyphReplace = Array("$1&#8217;$2", "&#8216;", "$1&#8221;$2", "&#8220;", "$1&#8230;", "<acronym title=""$2"">$1</acronym>", "$1<span class=""caps"">$2</span>$3", "&#8212;", " &#8211; ", "$1&#215;$2", "&#8482;", "&#174;", "&#169;")

	' Set toggle for turning off replacements between code or pre.
	CodePre = False

	' If there is no HTML, do a simple search and replace.
	If Not RegExpMatch(RegExp, Text, "<.*>") Then
		For J = 0 To UBound(GlyphSearch)
			Text = RegExpReplace(RegExp, Text, GlyphSearch(J), GlyphReplace(J))
		Next
	Else
		' VBScript regexes don't do splits, and they certainly can't capture the delimiters.
		' Although...the Execute method of the RegExp object returns a Matches collection. See the RegExpSplit function for more--I personally think it's quite a cool workaround.
		Text = Split(RegExpSplit(RegExp, Text, "(<.*?>)", "!Z!Z!Z!Z!"), "!Z!Z!Z!Z!")

		' Q: what's !Z!Z!Z!Z! about?
		' A: it's the delimiter, as VBScript functions can't return arrays. Replace this with text of your own choosing, if you like.

		' Q: why can't they return arrays?
		' A: because the scripting engine would get confused. For example, does Textile(I) mean get index I from array Textile, or apply function Textile to variable I?

		' I'm sorry. That was way too much commenting for a single line, especially as the actual work is done further down.

		For I = 0 To UBound(Text)
			' Could edit Text(I) directly. This way is probably slightly faster. Not that speed's a great concern here.
			Line = Text(I)

			' Matches are off if we're between code, pre, etc.
			If RegExpMatch(RegExp, Line, "<(code|pre|kbd|notextile)>") Then CodePre = True
			If RegExpMatch(RegExp, Line, "<\/(code|pre|kbd|notextile)>") Then CodePre = False

			' Replace the glyphs.
			If Not RegExpMatch(RegExp, Line, "<.*>") And Not CodePre Then
				For J = 0 To UBound(GlyphSearch)
					Line = RegExpReplace(RegExp, Line, GlyphSearch(J), GlyphReplace(J))
				Next
			End If

			' Do some entification if we're in the code/pre set of tags defined above.
			If CodePre Then
				Line = Replace(Line, "&", "&amp;")
				Line = Replace(Line, "<", "&lt;")
				Line = Replace(Line, ">", "&gt;")
				Line = Replace(Line, "&lt;pre&gt;", "<pre>")
				Line = Replace(Line, "&lt;code&gt;", "<code>")
				Line = Replace(Line, "&lt;notextile&gt;", "<notextile>")
				Line = Replace(Line, "&lt;kbd&gt;", "<kbd>")
			End If

			' Each line gets pushed to a new array.
			' Not any more, it's the same array now.
			Text(I) = Line
		Next

		' Text is now the new array, cast to a string
		Text = Join(Text, "")
	End If

	' Deal with forced breaks; this is going to be a problem between pre tags, but we'll clean them later.
	' What does this do again?
'	Text = RegExpReplace(RegExp, Text, "(\S)(_*)(\W*) *\n([^#*\s])", "$1$2$3<br />$4")

	' Simple linebreaks.
	Text = RegExpReplace(RegExp, Text, "([^\n])\n([^\n])", "$1<br />\n$2")

	' Might be a problem with lists.
	Text = Replace(Text, "l><br />", "l>" & vbNewLine)

	' Clear out multiple newlines for now.
	' Is this quicker than a regex?
	Do While InStr(Text, vbNewLine & vbNewLine)
		Text = Replace(Text, vbNewLine & vbNewLine, vbNewLine)
	Loop

	' Split the text into an array by newlines.
	Text = Text & vbNewLine & " "
	Text = Split(Text, vbNewLine)

	' These should be set to this by default, but it never hurts to be explicit.
	' (In a programming sense, you dirty bugger.)
	List = ""
	Pre  = False

	' Bulleted list: *; numeric list: #; blockquote: bq.; classy header: hn(class).; plain header: hn.; classy paragraph p(class).; plain paragraph; remaining plain paragraph.
	BlockSearch = Array("^\s?\*\s(.*)", "^\s?#\s(.*)", "^bq\. (.*)", "^h(\d)\(([\w]+)\)\.\s(.*)", "^h(\d)\. (.*)", "^p\(([\w]+)\)\.\s(.*)", "^p\. (.*)", "^([^\t ]+.*)")

	' liu and lio, also known as the diveintomark.org way of doing it, seem a better idea to me.
	BlockReplace = Array("\t\t<liu>$1</liu>", "\t\t<lio>$1</lio>", "\t<blockquote>$1</blockquote>", "\t<h$1 class=\""$2\"">$3</h$1>$4", "\t<h$1>$2</h$1>", "\t<p class=\""$1\"">$2</p>$3", "\t<p>$1</p>", "\t<p>$1</p>")

	' Loop through lines.
	For I = 0 To UBound(Text)
		Line = Text(I)

		' Deal with lines with single spaces on them.
		If RegExpMatch(RegExp, Line, "^\s*$") Then Line = ""

		' Matches are off if we're between pre (or code, says the original, but I see no code tags mentioned) tags.
		If RegExpMatch(RegExp, Line, "<pre>") Then Pre = True

		' Deal with block replacements first, then see if we're in a list.
		If Not Pre Then
			For J = 0 To UBound(BlockSearch)
				Line = RegExpReplace(RegExp, Line, BlockSearch(J), BlockReplace(J))
			Next
		End If

		' Kill any br tags that slipped in earlier.
		If Pre Then Line = Replace(Line, "<br />", vbNewLine)

		' Matches back on after pre.
		If RegExpMatch(RegExp, Line, "<\/pre>") Then Pre = False

		' On entry to a list, List realises its true potential.
		' Ordered lists are lio.
		If List = "" And RegExpMatch(RegExp, Line, "\t\t<liu>") Then
			List = "ul"
			Line = RegExpReplace(RegExp, Line, "(.*?<liu>.*?)", "\t<ul>\n$1")
		ElseIf List = "" And RegExpMatch(RegExp, Line, "\t\t<lio>") Then
			List = "ol"
			Line = RegExpReplace(RegExp, Line, "(.*?<lio>.*?)", "\t<ol>\n$1")
		' At the end of a ul.
		ElseIf List = "ul" And Not RegExpMatch(RegExp, Line, "\t<liu>") Then
			List = ""
			Line = RegExpReplace(RegExp, Line, "^(.*)$", "\t</ul>\n\n$1")
		' At the end of a ol.
		ElseIf List = "ol" And Not RegExpMatch(RegExp, Line, "\t<lio>") Then
			List = ""
			Line = RegExpReplace(RegExp, Line, "^(.*)$", "\t</ol>\n\n$1")
		End If

		' Push each line to a new array once processed.
		' Sod that, put it back in the same array.
		Text(I) = Line
	Next

	' Put it all back together again.
	Text = Join(Text, vbNewLine)

	' Clean up notextile--which doesn't quite work as I'd expect, BTW.
	Text = RegExpReplace(RegExp, Text, "<\/?notextile>", "")

	' Clean up lio and liu.
	Text = RegExpReplace(RegExp, Text, "<(\/?)li(u|o)>", "<$1li>")

	' Turn the temp char back to an ampersand entity.
	Text = Replace(Text, "x%x%", "&#38;")

	' Get rid of p around other block elements, like headings and blockquotes. Why? Because I suck.
	Text = RegExpReplace(RegExp, Text, "(<p>)?<(\/?)(h[1-6]|blockquote|p)>(<\/p>)?", "<$2$3>")

	' Newline linebreaks, just for markup tidiness.
	Text = Replace(Text, "<br />", "<br />" & vbNewLine)

	' For the reason above, add some more linebreaks.
	Text = RegExpReplace(RegExp, Text, "(<\/h[1-6]>|</p>|</blockquote>)", "$1\n")

	' Get rid of random brs.
	Text = RegExpReplace(RegExp, Text, "\n<br \/>\n", "")

	' Eliminate trailing linebreaks.
	' This probably has a problem when the client's sending things the server doesn't recognise as vbNewLine. So I've repeated it, in an ugly manner.
	Do While Right(Text, 1) = vbCrLf Or Right(Text, 1) = vbCr Or Right(Text, 1) = vbLf
		Text = Left(Text, Len(Text) - 1)
	Loop

'	If Not InStr(Text, vbNewLine & "<br />" & vbNewLine) Then Text = "The hell?"

	' Return the text. Would you believe me if I said I forgot this in an early version? Well, I did. Took me quite a while to figure it out.
	Textile = Text

	' The RegExp object has been our trusty workhorse, but glue keeps people's feet on the ground.
	Set RegExp = Nothing

	' This has been Textile.
End Function

' Behind-the-curtains regex stuff. Note that when I say 'replaces' in these functions, I don't mean that they are exact copies of the function they replace. The text comes first in these, and we have to pass a regular expression object.

Private Function RegExpMatch(RegExp, Text, Pattern)
	' Replaces preg_match.

	With RegExp
		.IgnoreCase = True
		.Global     = True
		.Pattern    = Pattern
	End With

	RegExpMatch = RegExp.Test(Text)
End Function

Private Function RegExpReplace(RegExp, Text, Pattern, ReplaceText)
	' Replaces preg_replace.

	With RegExp
		.IgnoreCase = True
		.Global     = True
		.Pattern    = Pattern
	End With

	' Look, I know I've done this the wrong way round, OK?
	' In this function, /i mean case sensitive, not case insensitive.
	If Right(Pattern, 2) = "/i" Then
		RegExp.IgnoreCase = False
		RegExp.Pattern    = Left(Pattern, Len(Pattern) - 2)
	End If

	' Tabs and newlines seem to not quite work right normally. No matter.
	ReplaceText = Replace(ReplaceText, "\t", vbTab)
	ReplaceText = Replace(ReplaceText, "\n", vbNewLine)

	RegExpReplace = RegExp.Replace(Text, ReplaceText)
End Function

Private Function RegExpSplit(RegExp, Text, Pattern, Delimiter)
	' Replaces preg_split (with PREG_SPLIT_DELIM_CAPTURE set).

	Dim Match, Matches, MatchInfo, Between

	With RegExp
		.IgnoreCase = True
		.Global     = True
		.Pattern    = Pattern
	End With

	Set Matches = RegExp.Execute(Text)

	MatchInfo = Array(1, 0, 1, 0)

	For Each Match In Matches
		' At first I thought this would be easy, but I had forgotten that I am stupid. Although this code isn't very long, it took a fair bit of head-wall interaction to get it right.

		' Previous match's index, previous match's length, current match's index, current match's length.
		MatchInfo(0) = MatchInfo(2)
		MatchInfo(1) = MatchInfo(3)
		MatchInfo(2) = Match.FirstIndex + 1
		MatchInfo(3) = Match.Length

		' Get the string in the text which starts at the end of the previous match, and continues for the difference between the end of the previous match and the start of the current match.
		Between = Mid(Text, MatchInfo(0) + MatchInfo(1), MatchInfo(2) - (MatchInfo(0) +  MatchInfo(1)))

		' If there is a string between the tags, add it. Otherwise don't.
		If Len(Between) > 0 Then
			RegExpSplit = RegExpSplit & Between & Delimiter
		End If

		' Add the match itself.
		RegExpSplit = RegExpSplit & Match.Value & Delimiter
	Next

	' Don't forget text after the last HTML tag! I really should have spotted this sooner.
	If MatchInfo(2) + MatchInfo(3) < Len(Text) Then
		RegExpSplit = RegExpSplit & Mid(Text, MatchInfo(2) + MatchInfo(3), Len(Text) - MatchInfo(2) + MatchInfo(3)) & Delimiter
	End If
End Function
%>
