import * as http from "http";
export type startUpOptions =
{
	/**
	 * the certificate if you are using https
	 */
	cert?:'',
	/**
	 * functions to be executed by visiting pages
	 */
	functions?:{internalFunction},
	/**
	 * amount of get requests per minute per ip
	 */
	getPerMinute?:1000,
	/**
	 * Allow iframes
	 */
	iframe?:false,
	/**
	 * Include jQuery or not
	 */
	jQuery:false,
	/**
	 * the key if you are using https
	 */
	key?:'',
	/**
	 * The directory with site pages
	 */
	pagesLocation?:'/site',
	/**
	 * The port the server will listen on.
	 * 
	 * 80 is default
	 * 
	 * http uses 80 and https uses 443
	 */
	port?:80,
	/**
	 * The function to handle post requests
	 */
	postHandler?:(data: any, req: http.ClientRequest, res: http.ServerResponse)=>any,
	/**
	 * amount of post requests per minute per ip
	 */
	postPerMinute?:10,
	/**
	 * The amount of time in milliseconds before a post request is closed
	 */
	postTime?:15000,
	/**
	 * If this is true someone can just make 404 requests and spam the console
	 */
	printErrors?:true,
	/**
	 * the protocol to be used
	 * 
	 * defaults to http
	 */
	protocol?:'http'|'https',
	/**
	 * If a rest API should be set up
	 */
	restApi?:false,
	/**
	 * The default file extension for the rest api
	 */
	restFileExtension:'json',
	/**
	 * Path to json files
	 */
	restLocation?:'/rest',
	/**
	 * The url prefix to interact with the api.
	 */
	restPrefix?:'/rest',
	/**
	 * Serve files from the disk or memory
	 */
	staticPage?:true,
	/**
	 * File extension to be sued for template files
	 */
	templateFileExtension?:'template',
	/**
	 * Path to template files
	 */
	templateLocation?:'/templates',
}

export type internalFunction = (req: http.ClientRequest)=>any;
type reloadFiles = ()=>void;

type serverAccess =
{
	/**
	 * Reloads all the server files
	 */
	reloadFiles:reloadFiles
	/**
	 * the server object
	 */
	server:http.Server,
}

type postCB = (data: any, req: http.ClientRequest, res: http.ServerResponse)=>any;
// ignore these errors as this code doesn't run
export function startServer(ops: startUpOptions = {}): serverAccess;