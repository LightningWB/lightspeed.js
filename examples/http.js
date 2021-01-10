const siteFrame = require('../src/lightspeedjs')
const fs = require('fs');
const pageVars = 
{
	test:1,
	visits:0
};
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
	staticPage:true,
	pagesLocation:'./pages',
	printErrors:true,
	restApi:true,
	restLocation:'./restJSON',
	restPrefix:'/r',
	functions:
	{
		foo:(req, queries)=>{console.log('queries:', JSON.stringify(queries), 'visited');pageVars.visits++;console.log(pageVars.visits)}
	},
	returnFunctions:
	{
		returnTest:()=>'test return function'
	},
	postHandler:(data, req, res)=>{console.log(data);res.end('ok')},
	jQuery:false,
	variables:pageVars
});

setInterval(
	()=>{
		pageVars.test++
	},
	1000
)