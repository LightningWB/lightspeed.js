"use strict";


function genRandomString(length)
{
	const allowedChars = '1234567890!#%&`~-_=:;\'",qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM';
	// @<> are removed since they could theoretically generate a command or html element
	let resultString = '';
	for( let i=0; i<length; i++ )
	{
		const index = Math.floor(Math.random()*allowedChars.length);
		resultString+=allowedChars.charAt(index);
	}
	return resultString;
}
module.exports.genRandomString = genRandomString;