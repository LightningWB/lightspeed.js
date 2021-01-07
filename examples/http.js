const siteFrame = require('../src/lightspeedjs')
const fs = require('fs');

/*siteFrame.startServer({
	port:443,
	staticPage:false,
	pagesLocation:'./pages',
	printErrors:true,
	restApi:true,
	restPath:'./restJSON',
	restPrefix:'/r',
	protocol:'https',
	cert:fs.readFileSync(__dirname+'/cert.pem', 'utf-8'),
	key:fs.readFileSync(__dirname+'/key.pem', 'utf-8')
}, (data, req, res)=>{console.log(data);res.end('ok')});*/

siteFrame.startServer({
	port:80,
	staticPage:false,
	pagesLocation:'./pages',
	printErrors:true,
	restApi:true,
	restPath:'./restJSON',
	restPrefix:'/r',
	functions:
	{
		//foo:()=>console.log('foo')
	},
	postHandler:(data, req, res)=>{console.log(data);res.end('ok')},
	jQuery:false
});