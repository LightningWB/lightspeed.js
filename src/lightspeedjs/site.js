//#region imports
"use strict";
__dirname = require.main.path;
const url = require('url');
const fs = require('fs');
const path = require('path');
const getPage = require('./getPage');
//#endregion
/**
 * Gets all local variables ready to go
 */
function buildServer()
{
	let http;// declare here so you can require it as http or https in the start server function
	/**
	 * Pages for the site
	 */
	let pages=
	{
		'/404.html':
		{
			page:'<!DOCTYPE html><html><head><title>404</title></head><body><h1>Error 404</h1><hr><a href="/">Home Page</a></body></html>',
			beforeFunctions:[],
			afterFunctions:[],
			variables:[],
			asyncReturnFunctions:[],
			returnFunctions:[]
		}
	};

	/**
	 * Rest api pages
	 */
	let restData={};

	/**
	 * Stores ip addresses to stop spam
	 */
	let ipLimit=
	{
		get:{},
		post:{}
	};
	/**
	 * Options
	 * @type {import('./types').startUpOptions}
	 */
	const options =
	{
		port:80,
		staticPage:true,
		pagesLocation:'./www',
		printErrors:true,
		restApi:false,
		restPrefix:'/rest',
		restLocation:'/rest',
		restFileExtension:'json',
		iframe:false,
		protocol:'http',
		key:'',
		cert:'',
		getPerMinute:1000,
		postPerMinute:10,
		functions:[],
		postHandler:(data, req, res)=>{if(options.printErrors)console.log('Error 404 on post', req.url)},// let them know a 404 post request was made
		templateLocation:'/templates',
		templateFileExtension:'template',
		__dirname:__dirname,
		jQuery:false,
		variables:{},
		returnFunctions:{},
		csrfProtection:true,
		fileTypeText:{},
		posts:{},
		log:console.log,
		start:true,
		plugins:[],
		streamFiles:{},
	}
	// post handling stuff
	let postFunctions = {};

	/**
	 * loads the post tree recursively
	 * @param {import('./types').postRequests} posts 
	 */
	function loadPosts(posts)
	{
		const compiledPosts = {};
		for(let url in posts)
		{
			const oldUrl = url;
			if(url.length>0 && url[0]!='/')url = '/'+url;// ads a / if it is a start because you need to do /something
			if(typeof posts[oldUrl]==='object')
			{
				const functions = loadPosts(posts[oldUrl]);
				for(let func in functions)
				{
					if(func.length>0 && func[0]!='/' && oldUrl.charAt(oldUrl.length-1)!='/')func='/'+func;// check if a / needs to be added before to split paths
					compiledPosts[url+func]=functions[func];
				}
			}
			else if(typeof posts[oldUrl]==='function')
			{
				compiledPosts[url]=posts[oldUrl];
			}
		}
		return compiledPosts;
	}

	/**
	 * @param {any} data 
	 * @param {import('http').IncomingMessage} req 
	 * @param {import('http').ServerResponse} res 
	 */
	async function callPost(data, req, res)
	{
		if( postFunctions[req.url] != undefined )
		{
			await postFunctions[req.url](data, req, res);
		}
		else options.postHandler(data, req, res);
		if(res.writable)res.end('');
		log(req, res);
	}

	// subdomain stuff
	let subDomains = {};
	/**
	 * compiles subdomain tree to one object, so it is far easier to add domains
	 * @param {any} domainTree 
	 */
	function compileSubs(domainTree)
	{
		const compiledSubs = {};
		for(let domain in domainTree)
		{
			const oldDomain = domain;
			if(
				typeof domainTree[oldDomain] === 'object' ||
				typeof domainTree[oldDomain] === 'function'
			){
				compiledSubs[domain]=domainTree[oldDomain];
			}
			else
			{
				const subs = compileSubs(domainTree[oldDomain]);
				for(let subDomain in subs)
				{
					subDomain='.'+subDomain;// check if a . should be added to split up domains
					compiledSubs[domain+subDomain]=subs[subDomain.substring(1)];
				}
			}
		}
		return compiledSubs;
	}

	/**
	 * Gets a list of files in a giver directory
	 * @param {String} dirPath pat to directory to scan
	 * @param {String[]} arrayOfFiles Array of files currently found
	 */
	function getAllFilesInDir(dirPath, arrayOfFiles=[])
	{
		const files = fs.readdirSync(dirPath);
		arrayOfFiles = arrayOfFiles || [];
		files.forEach((file)=>
		{
			if (fs.statSync(dirPath + "/" + file).isDirectory())
			{
				arrayOfFiles = getAllFilesInDir(dirPath + "/" + file, arrayOfFiles);
			}
			else
			{
				arrayOfFiles.push(path.join('./', dirPath, "/", file));
			}
		})
		return arrayOfFiles;
	}

	/**
	 * Sets all the pages for the website
	 */
	function setPages()
	{
		const fileNames = getAllFilesInDir(path.join(__dirname, options.pagesLocation));
		for(const i in fileNames)
		{
			const pageName = fileNames[i];
			// pop will remove the item from a junk array and return it
			const fileType = pageName.split('.').pop();
			if(options.streamFiles[fileType]!=true)
			{
				getPage
				(
					options,
					pageName,
					path.join(__dirname, options.pagesLocation),
					//path.join(__dirname, options.te),
					(data)=>pages[(pageName.replace(path.join(__dirname, options.pagesLocation).replace('.', ''), '').replace(/\\/g, '/')).replace(options.pagesLocation.replace('.', ''), '')]=data
				)
			}
			/*fs.readFile(pageName, {}, (err, data)=>
			{
				if(err && options.printErrors)console.log(err);
				pages[(pageName.replace(path.join(__dirname, options.pagesLocation).replace('.', ''), '').replace(/\\/g, '/')).replace(options.pagesLocation.replace('.', ''), '')]=data;
			});*/
		}
	}

	/**
	 * Sets all the rest api data for the site
	 */
	function setRest()
	{
		const fileNames = getAllFilesInDir(path.join(__dirname, options.restLocation), []);
		for(const i in fileNames)
		{
			const pageName = fileNames[i];
			// pop will remove the item from a junk array and return it
			const fileType = pageName.split('.').pop();
			if(options.streamFiles[fileType]!=true)
			{
				getPage
				(
					options,
					pageName,
					path.join(__dirname, options.pagesLocation),
					(data)=>restData[(pageName.replace(path.join(__dirname, options.restLocation).replace('.', ''), '').replace(/\\/g, '/')).replace(options.restLocation.replace('.', ''), '')]=data
				)
			}
			/*fs.readFile(pageName, {}, (err, data)=>
			{
				if(err && options.printErrors)console.log(err);
				restData[(pageName.replace(path.join(__dirname, options.restLocation).replace('.', ''), '').replace(/\\/g, '/')).replace(options.restLocation.replace('.', ''), '')]=data.toString();
			});*/
		}
	}

	/**
	 * Resets all the pages so you can update a website with static pages
	 */
	function reloadFiles()
	{
		if(!options.staticPage)return;
		pages = {'/404.html':'<!DOCTYPE html><html><head><title>404</title></head><body><h1>Error 404</h1></body></html>'};
		restData = {};
		setPages();
		if(options.restApi)setRest();
	}
	/**
	 * Redirects a user to a new url
	 * @param {import('http').ServerResponse} res 
	 * @param {String} location location to be redirected to
	 */
	const redirect = (res, location, req)=>
	{
		res.end('<!DOCTYPE html><html><head><title>Redirecting</title></head><body>Redirecting...</body><script>window.location=window.location.origin+"'+location+'"</script></html>');
		log(req, res);
	}

	/**
	 * calls a bunch of functions and includes error handling
	 * @param {Function[]} functions 
	 * @param {Object} queries 
	 * @param {import('http').IncomingMessage} req 
	 */
	function callFuncs(functions, queries, req)
	{
		try
		{
			for(const func of functions)options.functions[func](req, queries);
		}
		catch(err)
		{
			if(options.printErrors)console.log(err);
		}
	}

	/**
	 * send the page and perform and needed operations to the page
	 * @param {import('http').ClientRequest} req
	 * @param {import('http').ServerResponse} res 
	 * @param {import('./types').pages} page 
	 * @param {url.UrlWithParsedQuery} urlData
	 * @param {Boolean} fromRest
	 * @param {String} fileType
	 */
	async function sendPage(req, res, page, urlData, fromRest=false, fileType)
	{
		let pageNew = page.page;
		// the browser will move the script to where it belongs and it doesn't even render anything so this is fine
		if(options.jQuery && !fromRest && fileType==='html')pageNew+='<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>';
		if(options.fileTypeText[fileType]!=undefined)
		{
			if(options.fileTypeText[fileType].beginning!=undefined)pageNew = options.fileTypeText[fileType].beginning + pageNew;
			if(options.fileTypeText[fileType].end!=undefined)pageNew = pageNew + options.fileTypeText[fileType].end;
		}
		if(options.parser!=undefined)
		{
			pageNew = await options.parser.render(pageNew, urlData);
		}
		else
		{
			callFuncs(page.beforeFunctions, urlData.query, req);
			try// variables
			{
				for(let variable of page.variables)
				{
					const regEx = new RegExp(variable.key, 'g')
					pageNew = pageNew.replace(regEx, options.variables[variable.name]);
				}
			}
			catch(err)
			{
				if(options.printErrors)console.log('Error in variable writing', err);
			}
			try// return functions
			{
				for(let func of page.returnFunctions)
				{
					const regEx = new RegExp(func.key, 'g')
					pageNew = pageNew.replace(regEx, options.returnFunctions[func.name](req, urlData.query));
				}
			}
			catch(err)
			{
				if(options.printErrors)console.log('Error in variable writing', err);
			}
			try// return async functions
			{
				for(let func of page.asyncReturnFunctions)
				{
					const regEx = new RegExp(func.key, 'g')
					pageNew = pageNew.replace(regEx, await options.returnFunctions[func.name](req, urlData.query));
				}
			}
			catch(err)
			{
				if(options.printErrors)console.log('Error in variable writing', err);
			}
			callFuncs(page.afterFunctions, urlData.query, req);
		}
		res.end(pageNew);
		log(req, res);
	}

	/**
	 * gives a 404 response to a request
	 * @param {import('http').IncomingMessage} req 
	 * @param {import('http').ServerResponse} res 
	 * @param {boolean} redirectUser request or not on page request
	 * @param {boolean} rest if the request came from the rest api or not
	 */
	function give404(req, res, redirectUser=true, rest=false)
	{
		if(!res.writable)return;
		res.statusCode=404;
		if(rest)
		{
			if(options.printErrors)
			{
				console.log('Error 404 on rest: ', req.url);
			}
			res.end('{"fail":true,"reason":"404"}');
		}
		else
		{
			if(options.printErrors)
			{
				console.log('Error 404: ', req.url);
			}
			if(redirectUser)
			{
				redirect(res, '/404.html', req);
			}
			else
			{
				// if no 404 page is found on static pages then there won't be any functions or page variables so bypassing serve page is ok
				res.end(pages['/404.html'].page);
			}
		}
	}
	/**
	 * 
	 * @param {import('http').ClientRequest} req 
	 * @param {import('http').ServerResponse} res 
	 */
	function handleReq(req, res)
	{
		const urlData = url.parse(decodeURIComponent(req.url), true);
		const splitUp = urlData.pathname.split('.');
		let fileType = splitUp.length===1?undefined:splitUp[splitUp.length-1];// it uses undefined later on to add .html if it has no extension
		if(!options.iframe)res.setHeader('X-Frame-Options', 'SAMEORIGIN');
		if(options.csrfProtection)res.setHeader('set-cookie', 'csrfProtectionToken=true; Max-Age=86400; HttpOnly; SameSite=Strict; path=/');// a cookie with a max age of a day
		if(options.restApi && urlData.pathname.indexOf(options.restPrefix+'/')==0)// rest api
		{
			if(urlData.pathname[urlData.pathname.length-1]==='/')
			{
				fileType='json';
				urlData.pathname+='index.'+options.restFileExtension;
			}
			else if(fileType===undefined)
			{
				fileType='json';
				urlData.pathname+='.'+options.restFileExtension;
			}
			if(fileType==='json')res.setHeader('Content-Type', 'text/json; charset=UTF-8');
			if(restData[urlData.pathname.replace(options.restPrefix, '')]!=undefined || !options.staticPage || options.streamFiles[fileType])
			{
				if(options.streamFiles[fileType])
				{
					try
					{
						const stream = fs.createReadStream(path.join(__dirname, options.restLocation).replace('.', '')+String(urlData.pathname.replace(options.restPrefix, '')));
						stream.pipe(res);
						stream.on('end', ()=>log(req, res));
					}
					catch(err)
					{
						give404(req, res, true, true);
					}
				}
				else if(options.staticPage)
				{
					//callFuncs(restData[urlData.pathname.replace(options.restPrefix, '')].functions, req)
					return sendPage(req, res, restData[urlData.pathname.replace(options.restPrefix, '')], urlData, true, fileType);
				}
				else
				{
					getPage(
						options,
						path.join(__dirname, options.restLocation).replace('.', '')+String(urlData.pathname.replace(options.restPrefix, '')),
						path.join(__dirname, options.pagesLocation),
						(data)=>
						{
							//callFuncs(data.functions)
							//res.end(data.page);
							sendPage(req, res, data, urlData, true, fileType);
						},
						err=>
						{
							give404(req, res, false, true);
						}
					)
				}
			}
			else
			{
				give404(req, res, false, true);
			}
		}
		else// any other page
		{
			if(fileType==='css')res.writeHead(200,{'Content-Type':'text/css; charset=UTF-8'});
			else if(fileType==='js')res.writeHead(200,{'Content-Type':'text/js; charset=UTF-8'});
			else if(fileType==='png')res.writeHead(200,{'Content-Type':'img/png'});
			else if(fileType==='jpg')res.writeHead(200,{'Content-Type':'img/jpg'});
			else if(fileType==='html'||fileType===undefined)res.writeHead(200,{'Content-Type':'text/html; charset=UTF-8'});   
			if(urlData.pathname[urlData.pathname.length-1]==='/')
			{
				fileType = 'html';
				urlData.pathname+='index.html';// an example would be https:example.example/about/ would redirect to about/index.html
			}
			else if(fileType===undefined)
			{
				fileType='html';
				urlData.pathname+='.html';
			}// if there is no file extension and it doesnt end in /
			// ^ an example of this is https:example.example/about would redirect to about.html
			// static page is found or reading from files or streaming this file
			if(pages[urlData.pathname]!=undefined || !options.staticPage || options.streamFiles[fileType])
			{
				if(options.streamFiles[fileType])
				{
					try
					{
						const stream = fs.createReadStream(path.join(__dirname, options.pagesLocation, String(urlData.pathname)));
						stream.pipe(res);
						stream.on('end', ()=>log(req, res));
						stream.on('error', err=>{
							give404(req, res, true, false);
							stream.close();
						});
					}
					catch(err)
					{
						give404(req, res, true, false);
					}
				}
				else if(options.staticPage)
				{
					return sendPage(req, res, pages[urlData.pathname], urlData, false, fileType);
				}
				else
				{
					getPage
					(
						options,
						path.join(__dirname, options.pagesLocation, String(urlData.pathname)),
						path.join(__dirname, options.pagesLocation),
						(data)=>
						{
							sendPage(req, res, data, urlData, false, fileType)
						},
						(err)=>
						{
							give404(req, res, false, false);
						}
					)
					/*fs.readFile(
						path.join(__dirname, options.pagesLocation).replace('.', '')+String(urlData.pathname),
						(err, data)=>
						{
							if(err)
							{
								if(options.printErrors)
								{
									console.log('Error 404: ', urlData.pathname);
								}
								return redirect(res, '/404.html');
							}
							res.end(data);
						}
					)*/
				}
			}
			// no page found on static pages
			else
			{
				// on static pages a 404 page is saved by default
				give404(req, res, true, false);
			}
		}
	}
	/**
	 * uses common log format to access options.log and format stuff
	 * @param {import('http').ClientRequest} req 
	 * @param {import('http').ServerResponse} res
	 */
	function log(req, res)
	{
		options.log(
			req.socket.remoteAddress+
			' '+
			'- '+
			'- ['+
			new Date().toUTCString()+
			'] "'+
			req.method+
			' '+
			req.url+
			' '+
			req.httpVersion+
			'" '+
			res.statusCode+
			' '+
			req.socket.bytesWritten || '-'
		);
	}
	function startServer(ops={})
	{
		/**
		 * 
		 * @param {import('http').IncomingMessage} req 
		 * @param {import('http').ServerResponse} res 
		 */
		function handleRequest(req, res)
		{
			try
			{
				// sub domains
				let maxLength = -1, maxDomain;
				for(const subdomain in subDomains)
				{
					if(req.headers.host!=undefined && req.headers.host.indexOf(subdomain)===0)
					{
						// this stops sub from taking priority over sub1.sub if sub is lower
						if(subdomain.length > maxLength)
						{
							maxDomain = subdomain;
						}
					}
				}
				if(maxDomain!=undefined)
				{
					// lightspeed server
					if(typeof subDomains[maxDomain] === 'object')
					{
						subDomains[maxDomain].server.emit('request', req, res);
						return;
					}
					// this is express router stuff
					else if(typeof subDomains[maxDomain] === 'function')
					{
						subDomains[maxDomain](req, res);
						return;
					}
				}
				// then plugins
				for(let i=0; i<options.plugins.length; i++)
				{
					const plugin = options.plugins[i];
					if(plugin.modifications!=undefined)
					{
						if(plugin.modifications(req, res))
						{
							if(res.writable)res.end();
							return;
						}
					}
				}
				// then normal stuff
				if(req.method==='POST')
				{
					if(
						options.postPerMinute !== 0 &&
						ipLimit.post[req.connection.remoteAddress]!=undefined && 
						ipLimit.post[req.connection.remoteAddress]>options.postPerMinute
					)return res.end('spam');
					if(
						options.csrfProtection && 
						(
							req.headers.cookie===undefined ||
							!req.headers.cookie.includes('csrfProtectionToken=true')
						)
					){
						res.statusCode = 400;
						res.statusMessage = 'no csrf cookie';
						res.end('please visit the page first');
					}
					ipLimit.post[req.connection.remoteAddress]= (ipLimit.post[req.connection.remoteAddress] || 0)+1;
					let totalData = '';
					req.on('data', chunk=>totalData+=chunk);
					req.on('end', ()=>{
						callPost(totalData, req, res);
					});
				}
				else
				{
					if(
						options.getPerMinute !== 0 &&
						ipLimit.get[req.connection.remoteAddress]!=undefined &&
						ipLimit.get[req.connection.remoteAddress]>options.getPerMinute
					)return res.end('spam');
					ipLimit.get[req.connection.remoteAddress]= (ipLimit.get[req.connection.remoteAddress] || 0)+1;
					handleReq(req, res);
				}
			}
			catch(err)
			{
				if(options.printErrors)console.log(err);
			}
		}
		Object.assign(options, ops);
		if(options.protocol==='https')http = require('https');
		else if(options.protocol==='http')http = require('http');
		else throw 'unknown protocol';
		if(options.protocol==='https')// check for a key and certificate
		{
			if(options.key==='')throw 'a key is required for https';
			else if(options.cert==='')throw 'a certificate is required for https';
		}
		// a basic for loop allows plugins to add plugins as dependencies
		for(let i=0; i<options.plugins.length; i++)
		{
			const plugin = options.plugins[i];
			if(plugin.options!=undefined)
			{
				// it can modify options directly and doesn't have to overwrite because it is then harder to break the server then
				plugin.options(options);
			}
		}
		if(options.staticPage)setPages(pages);
		if(options.staticPage && options.restApi)setRest();
		postFunctions = loadPosts(options.posts);
		subDomains = compileSubs(options.subDomains);
		let server;
		if(options.protocol==='http'){server = http.createServer(handleRequest);}
		else if(options.protocol==='https'){server = http.createServer({key:options.key, cert:options.cert}, handleRequest);}
		setInterval
		(
			()=>
			{
				ipLimit.get={};
				ipLimit.post={};
			},
			1000*10
		);
		function start()
		{	
			server.listen(options.port);
		}
		if(options.start)start();
		return {server:server, reloadFiles:reloadFiles, start:start};
	}
	return startServer;
}
/**
 * Starts and returns a http server.
 * @param {import('./types').startUpOptions} ops options for the server.
 */
function startServer(ops={})
{
	return buildServer()(ops);
}

module.exports=startServer;