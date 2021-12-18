"use strict";
const fs = require('fs');
const path = require('path');
const crypto = require('./crypto');
const settings =
{
	startPrefix:'@&',// reminder that changing these require you to change regex bellow
	endPrefix:'&@',
	startParam:'[',
	endParam:']',
	splitter:'|',
	replacerFunctions:['variable', 'returnFunction', 'asyncReturnFunction'],
	functions:['function', 'finishFunction'],
	combined:[''],
	returnDynamicMarker:'__returnDynamicMarker__'
}
settings.combined=settings.replacerFunctions.concat(settings.functions);// do this after values are set

/**
 * parses an action in the file
 * @param {String} input input action
 */
function parseAction(input)
{
	const action = input.substring(0, input.indexOf(settings.startParam));
	const endPram = input.lastIndexOf(settings.endParam);
	const params = input.substring(input.indexOf(settings.startParam)+1, endPram).split(settings.splitter);
	for(const i in params)
	{
		params[i]=params[i].trim().replace(/\\&/g, '&').replace(/\\@/g, '@').replace(/\\\|/g, '|');// each pass through it gets rid of a \
	}
	return {action:action.trim(), parameters:params.filter(item=>item!='')}
}

async function getReplacer(options, action, err)
{
	//console.log(action);
	//console.log(action.action)
	switch (action.action)
	{
		case 'include':
			let includedData = '';
			for(const file of action.parameters)
			{
				try
				{
					if(file.indexOf('.')===0)includedData+=await fs.promises.readFile(path.join(options.relLocation, file));// for relative paths
					else includedData+=await fs.promises.readFile(path.join(options.homeLocation, file));
				}
				catch(er){err(er);}
			}
			return includedData;
		case 'template':
			let replacedData='';
			//console.log(action)
			try
			{
				const templateName = action.parameters[0] + '.' + options.templateExtension;
				if(templateName.indexOf('.')===0)replacedData+=await fs.promises.readFile(path.join(options.templateLocation, templateName));// for relative paths
				else replacedData+=await fs.promises.readFile(path.join(options.templateLocation, templateName));
				for(let i=1; i<action.parameters.length; i++)
				{
					while(replacedData.includes(settings.startPrefix+i+settings.endPrefix))replacedData = replacedData.replace(settings.startPrefix+i+settings.endPrefix, action.parameters[i])
				}
			}
			catch(er){err(er);}
			return replacedData;
		default:// let it replace it all so they dont know the backend as easily
			return '';
	}
}

/**
 * 
 * @param {Object} action the action parsed
 */
function getAdditionalData(action)
{
	//console.log(action);
	let returns = {};
	let functions;
	switch (action.action)
	{
		case 'function':
			functions = action.parameters;
			returns.beforeFunctions = functions;
			break;
		case 'finishFunction':
			functions = action.parameters;
			returns.afterFunctions = functions;
			break;
		default:// let it show as what they entered if no action is available
			return action.action+settings.startParam+action.parameters.join(settings.splitter)+settings.endParam;
	}
	return returns;
}

function getErrorMessage(actionName)
{
	let errorMessage = 'Error: '
	switch (actionName)
	{
		case 'variable':
			errorMessage+='a variable must be passed for the variable command';
			break;
		case 'returnFunction':
			errorMessage+='a function must be passed for the returnFunction command';
			break;
		case 'asyncReturnFunction':
			errorMessage+='a function must be passed for the asyncReturnFunction command';
			break;
		default:
			break;
	}
	return errorMessage;
}

/**
 * 
 * @param {Object} action 
 * @returns {import('./types').variable}
 */
function getVariables(action)
{
	let returns = {};
	const errorMsg = getErrorMessage(action.action);
	//console.log(action)
	if(action.parameters.length===0)
	{
		console.log(errorMsg);
		return 'fail';
	}
	let dynamicDataName = action.parameters[0];
	returns =
	{
		name:dynamicDataName,
		key:
			settings.returnDynamicMarker+
			crypto.genRandomString(20)+
			dynamicDataName+
			crypto.genRandomString(20)+
			settings.returnDynamicMarker
	};
	return returns;
}

/**
 * 
 * @param {import('./types').startUpOptions} options server options
 * @param {String} pagePath path to file
 * @param {Function} cb success call back
 * @param {Function} er error callback
 */
module.exports=function getPage(options, pagePath, homeLocation, cb, er=console.log)
{
	const fileType = path.extname(pagePath);
	const binaryTypes = ['.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.webp'];
	fs.readFile
	(
		pagePath,
		async (err, data)=>
		{
			try
			{
				if(err)return er(err);
				let result =
				{
					page:data,
					beforeFunctions:[],
					afterFunctions:[],
					variables:[],
					returnFunctions:[],
					asyncReturnFunctions:[],
				};
				if(options.parser!=undefined)
				{
					return await cb({
							page:await options.parser.compile(data, pagePath)
					});
				}
				else if(data!=undefined && data.includes(settings.startPrefix) && data.includes(settings.endPrefix) && !binaryTypes.includes(fileType))// only do this if it is doing special commands
				{
					while(data.includes(settings.startPrefix) && data.includes(settings.endPrefix))// turns out that doing a while loop and adding data to it automatically parses included files
					{
						data = data.toString();
						const startIndex = data.indexOf(settings.startPrefix);
						const endIndex = data.indexOf(settings.endPrefix);
						const action = data.substring(startIndex+settings.startPrefix.length, endIndex);
						let replacer = '';
						let additionalData={};
						const actions = parseAction(action);
						if(!settings.combined.includes(actions.action))
							replacer = await getReplacer(
								{
									homeLocation:homeLocation,
									relLocation:path.dirname(pagePath),
									templateLocation:path.join(options.__dirname, options.templateLocation),
									templateExtension:options.templateFileExtension,
									functions:options.functions
								},
								actions,
								er
							);
						else if(settings.replacerFunctions.includes(actions.action))
						{
							let replacerDynamicData = getVariables(actions);
							if(replacerDynamicData!='fail')
							{
								replacer = replacerDynamicData.key;
								let key;
								if(actions.action==='variable')key='variables';
								else if(actions.action==='returnFunction')key = 'returnFunctions';
								else if(actions.action==='asyncReturnFunction')key = 'asyncReturnFunctions';
								result[key].push(replacerDynamicData);
							}
						}
						else if(settings.functions.includes(actions.action))
						{
							additionalData = getAdditionalData(actions);// maybe I will do async functions or something
							if(additionalData.beforeFunctions!=undefined)result.beforeFunctions = result.beforeFunctions.concat(additionalData.beforeFunctions);// add before functions to list
							if(additionalData.afterFunctions!=undefined)result.afterFunctions = result.afterFunctions.concat(additionalData.afterFunctions);// add after functions to list
						}
						data = data.substr(0, startIndex) + replacer + data.substr(endIndex+settings.endPrefix.length, data.length-startIndex);// insert the new stuff
					}
					data = data.replace(/@\\&/g, settings.startPrefix).replace(/&\\@/g, settings.endPrefix);
					result.page = data;
					cb(result);
				}
				else cb(result);
			}
			catch(err)
			{
				console.log(err)
				er(err)
			}
		}
	)
}