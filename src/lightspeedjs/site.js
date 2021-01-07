//#region imports
"use strict";
let http;// declare at as a global so you can require it as http or https in the start server function
const url = require('url');
const fs = require('fs');
const path = require('path');
const getPage = require('./getPage');
//#endregion
//#region file storing and other variables
let pages=
{
	'/404.html':'<!DOCTYPE html><html><head><title>404</title></head><body><h1>Error 404</h1></body></html>'
};

let restData={};

let ipLimit=
{
	get:{},
	post:{}
};
//#endregion
//#region options
const options =
{
	port:80,
	staticPage:true,
	pagesLocation:'./site',
	printErrors:true,
	postTime:15*1000,
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
	postHandler:()=>{},
	templateLocation:'/templates',
	templateFileExtension:'template',
	__dirname:__dirname,
	jQuery:false,
	variables:{},
}
//#endregion
//#region File handling
function getAllFilesInDir(dirPath, arrayOfFiles)
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

function setPages()
{
	const fileNames = getAllFilesInDir(path.join(__dirname, options.pagesLocation), []);
	for(const i in fileNames)
	{
		const pageName = fileNames[i];
		getPage
		(
			options,
			pageName,
			path.join(__dirname, options.pagesLocation),
			//path.join(__dirname, options.te),
			(data)=>pages[(pageName.replace(path.join(__dirname, options.pagesLocation).replace('.', ''), '').replace(/\\/g, '/')).replace(options.pagesLocation.replace('.', ''), '')]=data
		)
		/*fs.readFile(pageName, {}, (err, data)=>
		{
			if(err && options.printErrors)console.log(err);
			pages[(pageName.replace(path.join(__dirname, options.pagesLocation).replace('.', ''), '').replace(/\\/g, '/')).replace(options.pagesLocation.replace('.', ''), '')]=data;
		});*/
	}
}

function setRest()
{
	const fileNames = getAllFilesInDir(path.join(__dirname, options.restLocation), []);
	for(const i in fileNames)
	{
		const pageName = fileNames[i];
		getPage
		(
			options,
			pageName,
			path.join(__dirname, options.pagesLocation),
			(data)=>restData[(pageName.replace(path.join(__dirname, options.restLocation).replace('.', ''), '').replace(/\\/g, '/')).replace(options.restLocation.replace('.', ''), '')]=data
		)
		/*fs.readFile(pageName, {}, (err, data)=>
		{
			if(err && options.printErrors)console.log(err);
			restData[(pageName.replace(path.join(__dirname, options.restLocation).replace('.', ''), '').replace(/\\/g, '/')).replace(options.restLocation.replace('.', ''), '')]=data.toString();
		});*/
	}
}

function reloadFiles()
{
	if(!options.staticPage)return;
	pages = {'/404.html':'<!DOCTYPE html><html><head><title>404</title></head><body><h1>Error 404</h1></body></html>'};
	restData = {};
	setPages();
	if(options.restApi)setRest();
}
//#endregion
//#region webserver functions
const redirect = (res, location)=>res.end('<!DOCTYPE html><html><head><title>Redirecting</title></head><body>Redirecting...</body><script>window.location=window.location.origin+"'+location+'"</script></html>');

function callFuncs(functions, queries, req)
{
	try{for(const func of functions)options.functions[func](req, queries);}
	catch(err){if(options.printErrors)console.log(err);}
}

/**
 * send the page and perform and needed operations to the page
 * @param {import('http').ServerResponse} res 
 * @param {import('./types').pages} page 
 * @param {url.UrlWithParsedQuery} urlData
 * @param {Boolean} fromRest
 */
function sendPage(req, res, page, urlData, fromRest=false)
{
	let pageNew = page.page;
	if(options.jQuery && !fromRest)pageNew+='<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>';
	callFuncs(page.functions, urlData.query, req);
	try
	{
		for(let variable of page.variables)
		{
			const regEx = new RegExp(variable.key, 'g')
			pageNew = pageNew.replace(regEx, options.variables[variable.name]);
		}
	}
	catch(err)
	{
		console.log('Error in variable writing', err);
	}
	res.end(pageNew);
}

/**
 * 
 * @param {import('http').ClientRequest} req 
 * @param {import('http').ServerResponse} res 
 */
function handleReq(req, res)
{
	const urlData = url.parse(req.url, true);
	const splitUp = urlData.pathname.split('.');
	const fileType = splitUp.length===1?undefined:splitUp[splitUp.length-1];// it uses undefined later on to add .html if it has no extension
	if(!options.iframe)res.setHeader('X-Frame-Options', 'SAMEORIGIN');
	if(options.restApi && urlData.pathname.indexOf(options.restPrefix+'/')==0)// rest api
	{
		if(urlData.pathname[urlData.pathname.length-1]==='/')urlData.pathname+='index.'+options.restFileExtension;
		else if(fileType===undefined)urlData.pathname+='.'+options.restFileExtension;
		res.writeHead(200, {'Content-Type':'text/json'});
		if(restData[urlData.pathname.replace(options.restPrefix, '')]!=undefined || !options.staticPage)
		{
			if(options.staticPage)
			{
				//callFuncs(restData[urlData.pathname.replace(options.restPrefix, '')].functions, req)
				return sendPage(req, res, restData[urlData.pathname.replace(options.restPrefix, '')], urlData, true);
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
						sendPage(req, res, data, urlData, true);
					},
					err=>
					{
						if(options.printErrors)console.log('Error 404 on rest: ', urlData.pathname);
						return res.end('{"fail":true,"reason":"404"}');
					}
				)
			}
		}
		else
		{
			if(options.printErrors)console.log('Error 404 on rest: ', urlData.pathname);
			return res.end('{"fail":true,"reason":"404"}');
		}
	}
	else// any other page
	{
		if(fileType==='css')res.writeHead(200,{'Content-Type':'text/css'});
		else if(fileType==='js')res.writeHead(200,{'Content-Type':'text/js'});
		else if(fileType==='png')res.writeHead(200,{'Content-Type':'img/png'});
		else if(fileType==='jpg')res.writeHead(200,{'Content-Type':'img/jpg'});
		else if(fileType==='html'||fileType===undefined)res.writeHead(200,{'Content-Type':'text/html'});   
		if(urlData.pathname[urlData.pathname.length-1]==='/')urlData.pathname+='index.html';// an example would be https:example.example/about/ would redirect to about/index.html
		else if(fileType===undefined)urlData.pathname+='.html';// if there is no file extension and it doesnt end in /
		// ^ an example of this is https:example.example/about would redirect to about.html
		// static page is found or reading from files
		if(pages[urlData.pathname]!=undefined||!options.staticPage)
		{
			if(options.staticPage)
			{
				return sendPage(req, res, pages[urlData.pathname], urlData, false);
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
						sendPage(req, res, data, urlData, false)
					},
					(err)=>
					{
						if(options.printErrors)console.log('Error 404: ', urlData.pathname);
						console.log(err)
						return redirect(res, '/404.html');
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
			if(options.printErrors)console.log('Error 404: ', urlData.path);
			return redirect(res, '/404.html');
		}
	}
}
//#endregion
//#region start server
/**
 * Starts and returns a http server.
 * @param {Boolean} staticPage If true pages will be served from memory rather than reading a file every request.
 * @param {import('./types').startUpOptions} ops options for the server.
 * @param {Function} post post request handler. error handling is included to your code can be nicer.
 * @returns {import('./types').S}
 */
function startServer(ops={}, post=()=>{})
{
	/**
	 * 
	 * @param {import('http').ClientRequest} req 
	 * @param {import('http').ServerResponse} res 
	 */
	function handleRequest(req, res)
	{
		try
		{
			if(req.method==='POST')
			{
				if(ipLimit.post[req.connection.remoteAddress]!=undefined && ipLimit.post[req.connection.remoteAddress]>options.postPerMinute)return res.end('spam');
				ipLimit.post[req.connection.remoteAddress]= (ipLimit.post[req.connection.remoteAddress] || 0)+1;
				const timer=setTimeout(()=>{res.end('');console.log('killed')}, options.postTime);
				let totalData = '';
				req.on('data', chunk=>totalData+=chunk);
				req.on('end', ()=>{clearTimeout(timer);post(totalData, req, res)});
			}
			else
			{
				if(ipLimit.get[req.connection.remoteAddress]!=undefined && ipLimit.get[req.connection.remoteAddress]>options.getPerMinute)return res.end('spam');
				ipLimit.get[req.connection.remoteAddress]= (ipLimit.get[req.connection.remoteAddress] || 0)+1;
				handleReq(req, res);
			}
		}
		catch(err)
		{
			console.log(err);
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
	if(options.staticPage)setPages(pages);
	if(options.staticPage && options.restApi)setRest();
	let server;
	if(options.protocol==='http'){server = http.createServer(handleRequest);}
	else if(options.protocol==='https'){server = http.createServer({key:options.key, cert:options.cert}, handleRequest);}
	server.listen(options.port);
	outPut = {server:server, reloadFiles:reloadFiles};
	setInterval
	(
		()=>
		{
			ipLimit.get={};
			ipLimit.post={};
		},
		1000*10
	)
}
startServer(ops, post);
//#endregion