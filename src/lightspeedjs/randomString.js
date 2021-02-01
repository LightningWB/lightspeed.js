"use strict";

function genRandomString(length)
{
	const allowedChars = '1234567890qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM!@#$%^&*()_+~`-={}[]|\\:;\'",<>.?/';
	let resultString = '';
	for( let i=0; i<length; i++ )
	{
		const index = Math.floor(Math.random()*allowedChars.length);
		resultString+=allowedChars.charAt(index);
	}
	return resultString;
}
module.exports = genRandomString;