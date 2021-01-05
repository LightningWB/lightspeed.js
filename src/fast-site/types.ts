import * as http from "http";
export type startUpOptions =
{
	/**
	 * The port the server will listen on.
	 * 
	 * 80 is default for http and 443 is default for https
	 */
	port?:80,
	/**
	 * Serve files from the disk or memory
	 */
	staticPage?:true,
	/**
	 * The directory with site pages
	 */
	pagesLocation?:'/site',
	/**
	 * If this is true someone can just make bad requests and spam the console
	 */
	printErrors?:true,
	/**
	 * The amount of time in milliseconds before a post request is closed
	 */
	postTime?:15000,
	/**
	 * If a rest API should be set up
	 */
	restApi?:false,
	/**
	 * The url prefix to interact with the api.
	 */
	restPrefix?:'/rest',
	/**
	 * Path to json files
	 */
	restLocation?:'/restJSON',
	/**
	 * The default file extension for the rest api
	 */
	restFileExtension:'json',
	/**
	 * Allow iframes
	 */
	iframe?:false,
	/**
	 * the protocol to be used
	 * 
	 * defaults to http
	 */
	protocol?:'http'|'https',
	/**
	 * the key if you are using https
	 */
	key?:'',
	/**
	 * the certificate if you are using https
	 */
	cert?:'',
	/**
	 * amount of get requests per minute per ip
	 */
	getPerMinute?:1000,
	/**
	 * amount of post requests per minute per ip
	 */
	postPerMinute?:10,
	/**
	 * functions to be executed by visiting pages
	 */
	functions?:{internalFunction},
	/**
	 * The function to handle post requests
	 */
	postHandler?:(data: any, req: http.ClientRequest, res: http.ServerResponse)=>any,
	/**
	 * Path to template files
	 */
	templateLocation?:'/templates',
	/**
	 * File extension to be sued for template files
	 */
	templateFileExtension?:'template'
}

export type internalFunction = (req: http.ClientRequest)=>any;

type serverAccess =
{
	/**
	 * the server object
	 */
	server:http.Server,
	/**
	 * Reloads all the server files
	 */
	reloadFiles:Function
}

type postCB = (data: any, req: http.ClientRequest, res: http.ServerResponse)=>any;
// ignore these errors as this code doesn't run
export function startServer(ops: startUpOptions = {}): serverAccess;