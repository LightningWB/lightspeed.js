import * as http from "http";// I bet http and https are close enough for this not to matter
import * as url from "url";

type reloadFiles = ()=>void;

type serverAccess =
{
	/**
	 * Reloads all the server files
	 */
	reloadFiles:reloadFiles,
	/**
	 * the server object
	 */
	server:http.Server,
	/**
	 * starts the server if it is already not started
	 */
	start:()=>void
}

type postCB = (data: any, req: http.IncomingMessage, res: http.OutgoingMessage)=>any;

type internalFunction = (req: http.IncomingMessage, queries:any)=>any;

type loggingFunction = (message:string)=>any;

type textReplace =
{
	beginning:String,
	end:String
}

namespace lightspeed
{
	/**
	 * Encodes all characters that generally lead to xss
	 * @param html 
	 */
	export declare function htmlEscape(html:string): string;
	/**
	 * Generates a random string for a given length
	 * @param length 
	 */
	export declare function randomString(length:number): string;
	/**
	 * A page with other data
	 */
	export type pages =
	{
		page:String,
		beforeFunctions:internalFunction[],
		afterFunctions:internalFunction[],
		variables:variable[],
		returnFunctions:internalFunction[],
		asyncReturnFunctions:internalFunction[],
	}
	export type postRequests = postCB | {postRequests};
	/**
	 * Options to start the server
	 */
	export type startUpOptions =
	{
		/**
		 * the certificate if you are using https
		 */
		cert?:'' | String,
		/**
		 * keep this at true unless you know what you are doing
		 */
		csrfProtection?:true | Boolean,
		/**
		 * text to be added based on file extensions
		 */
		fileTypeText?:{[key:string]:textReplace},
		/**
		 * functions to be executed by visiting pages
		 */
		functions?:{[key:string]:internalFunction},
		/**
		 * amount of get requests per minute per ip
		 */
		getPerMinute?:1000 | Number,
		/**
		 * Allow iframes
		 */
		iframe?:false | Boolean,
		/**
		 * Include jQuery or not
		 */
		jQuery?:false | Boolean,
		/**
		 * the key if you are using https
		 */
		key?:'' | String,
		/**
		 * a logging function iun common log format
		 * 
		 * defaults to console.log
		 */
		log?:loggingFunction,
		/**
		 * The directory with site pages
		 */
		pagesLocation?:'/site' | String,
		/**
		 * The port the server will listen on.
		 * 
		 * 80 is default
		 * 
		 * http uses 80 and https uses 443
		 */
		port?:80 | Number,
		/**
		 * The function to handle post requests if no function is found in posts
		 */
		postHandler?:(data: any, req: http.IncomingMessage, res: http.OutgoingMessage)=>any,
		/**
		 * Handles post requests
		 * 
		 * ```js
			{
			    '/login':login,
			    '/signup':signup,
			    '/api':
			    {
			        '/onlineNow':onlineNow,
			        '/sendMessage':sendMessage
			    }
			}
		```
		 */
		posts?:{[key:string]:postRequests}
		/**
		 * amount of post requests per minute per ip
		 */
		postPerMinute?:10 | Number,
		/**
		 * The amount of time in milliseconds before a post request is closed
		 */
		postTime?:15000 | Number,
		/**
		 * If this is true someone can just make 404 requests and spam the console
		 */
		printErrors?:true | Boolean,
		/**
		 * the protocol to be used
		 * 
		 * defaults to http
		 */
		protocol?:'http'|'https' | String,
		/**
		 * Functions that are able to return js
		 */
		returnFunctions?:{[key:string]:internalFunction},
		/**
		 * If a rest API should be set up
		 */
		restApi?:false | Boolean,
		/**
		 * The default file extension for the rest api
		 */
		restFileExtension?:'json' | String,
		/**
		 * Path to json files
		 */
		restLocation?:'/rest' | String,
		/**
		 * The url prefix to interact with the api.
		 */
		restPrefix?:'/rest' | String,
		/**
		 * wether or not to start the server
		 */
		start?:true | boolean,
		/**
		 * Serve files from the disk or memory
		 */
		staticPage?:true | Boolean,
		subDomains?:{[key:string]:serverAccess},
		/**
		 * File extension to be sued for template files
		 */
		templateFileExtension?:'template' | String,
		/**
		 * Path to template files
		 */
		templateLocation?:'/templates' | String,
		/**
		 * The variables accessible to the internal variable commands
		 * 
		 * You can edit this object while running to change variables
		 */
		variables?:{} | Object,
	}
	/**
	 * A variable in the page
	 */
	export type variable =
	{
		/**
		 * variable name
		 */
		name:String,
		/**
		 * The random key to use to replace the value with real variable
		 * 
		 * it should be randomString+name+randomString
		 */
		key:String
	}
}
/**
 * starts the server
 */
declare function lightspeed(ops: lightspeed.startUpOptions | void): serverAccess;
export = lightspeed