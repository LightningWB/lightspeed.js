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

type postCB = (data: any, req: http.ClientRequest, res: http.ServerResponse)=>any;

type internalFunction = (req: http.IncomingMessage, queries:any)=>any;

type loggingFunction = (message:string)=>any;

type textReplace =
{
	beginning:String,
	end:String
}

type plugin =
{
	options:(ops:lightspeed.startUpOptions)=>any,
	modifications:(req:http.ClientRequest, res:http.ServerResponse)=>any|boolean
}

type compileFile = (file:Buffer, path:string)=>any;
type renderFile = (file:any, urlData:url.UrlWithParsedQuery)=>any;

declare namespace lightspeed
{
	/**
	 * Encodes all characters that generally lead to xss
	 * @param html 
	 */
	export function htmlEscape(html:string): string;
	/**
	 * Generates a random string for a given length
	 * @param length 
	 */
	export function randomString(length:number): string;
	type postRequests = postCB | {postRequests};
	/**
	 * Options to start the server
	 */
	export type startUpOptions =
	{
		/**
		 * the certificate if you are using https
		 */
		cert?:'' | string,
		/**
		 * keep this at true unless you know what you are doing
		 */
		csrfProtection?:true | boolean,
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
		getPerMinute?:1000 | number,
		/**
		 * Allow iframes
		 */
		iframe?:false | boolean,
		/**
		 * Include jQuery or not
		 */
		jQuery?:false | boolean,
		/**
		 * the key if you are using https
		 */
		key?:'' | string,
		/**
		 * a logging function iun common log format
		 * 
		 * defaults to console.log
		 */
		log?:loggingFunction,
		/**
		 * The directory with site pages
		 */
		pagesLocation?:'/www' | string,
		/**
		 * allows a custom parser to be used in place of the custom default one
		 */
		parser?:{
			/**
			 * the function to compile a page
			 * will pass the buffer from reading the file and nothing more
			 */
			compile:compileFile,
			context:{} | object,
			/**
			 * the function to render the page to add variables and such
			 * will only pass the page to it and not any special context
			 */
			render:renderFile
		}
		/**
		 * a list of plugins that get used starting from 0 to the last index
		 */
		plugins?:plugin[],
		/**
		 * The port the server will listen on.
		 * 
		 * 80 is default
		 * 
		 * http uses 80 and https uses 443
		 */
		port?:80 | number,
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
		postPerMinute?:10 | number,
		/**
		 * The amount of time in milliseconds before a post request is closed
		 */
		postTime?:15000 | number,
		/**
		 * If this is true someone can just make 404 requests and spam the console
		 */
		printErrors?:true | boolean,
		/**
		 * the protocol to be used
		 * 
		 * defaults to http
		 */
		protocol?:'http'|'https' | string,
		/**
		 * Functions that are able to return js
		 */
		returnFunctions?:{[key:string]:internalFunction},
		/**
		 * If a rest API should be set up
		 */
		restApi?:false | boolean,
		/**
		 * The default file extension for the rest api
		 */
		restFileExtension?:'json' | string,
		/**
		 * Path to json files
		 */
		restLocation?:'/rest' | string,
		/**
		 * The url prefix to interact with the api.
		 */
		restPrefix?:'/rest' | string,
		/**
		 * wether or not to start the server
		 */
		start?:true | boolean,
		/**
		 * Serve files from the disk or memory
		 */
		staticPage?:true | boolean,
		/**
		 * File types to be streamed instead of being stored in memory and kept there. Bypasses page parser and global text. Useful for stuff like videos and images.
		 */
		streamFiles:{[key:string]:boolean},
		/**
		 * Subdomains to be used
		 */
		subDomains?:{[key:string]:serverAccess},
		/**
		 * File extension to be sued for template files
		 */
		templateFileExtension?:'template' | string,
		/**
		 * Path to template files
		 */
		templateLocation?:'/templates' | string,
		/**
		 * The variables accessible to the internal variable commands
		 * 
		 * You can edit this object while running to change variables
		 */
		variables?:{} | object,
	}
}
/**
 * starts the server
 */
declare function lightspeed(ops: lightspeed.startUpOptions | void): serverAccess;
export = lightspeed