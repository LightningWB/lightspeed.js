"use strict";
const vm = require('vm');
const fs = require('fs');
const path = require('path');
const serverCode = fs.readFileSync(__dirname+'/site.js');
/**
 * Starts and returns a http server.
 * @param {import('./types').startUpOptions} ops options for the server.
 * @param {Function} post post request handler. error handling is included so your code can be nicer.
 * @returns {import('./types').serverAccess}
 */
function startServer(ops={}, post=()=>{})
{
	const context=
	{
		require:require, 
		ops:ops, post:post, 
		console:{log:console.log},
		__dirname:path.dirname(require.main.filename),
		setTimeout:setTimeout,
		clearTimeout:clearTimeout,
		outPut:{},
		setInterval:setInterval
	};
	if(ops.printErrors===false)context.console.log=()=>{};
	vm.createContext(context);
	vm.runInNewContext(serverCode, context);
	return context.outPut;
}

module.exports.startServer=startServer;