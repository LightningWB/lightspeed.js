const chars = {
	'&': '&amp;',
	'<': '&lt;',
	'>': '&gt;',
	'\'': '&#39;',
	'"': '&quot;'
}
/**
 * Html encodes characters that may result in xss
 * @param {String} html html to escape
 */
module.exports=function htmlEscape(html)
{
	return html.replace( /[&<>'"]/g, char => chars[char] );
}