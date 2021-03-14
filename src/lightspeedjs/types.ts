import * as http from "http";// I bet http and https are close enough for this not to matter
import * as lightspeed from "./index";

type postCB = (data: any, req: http.ClientRequest, res: http.ServerResponse)=>any;

type internalFunction = (req: http.IncomingMessage, queries:any)=>any;

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
} | any
export type postRequests = postCB | {postRequests};

/**
 * Options to start the server
 */
export type startUpOptions = lightspeed.startUpOptions

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
