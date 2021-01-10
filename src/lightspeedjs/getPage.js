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
	notReplaceFunctions:['function', 'finishFunction', 'variable'],
	variableMarker:'__variable__'
}

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
	return {action:action.trim(), parameters:params}
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

/**
 * 
 * @param {Object} action 
 * @returns {import('./types').variable}
 */
function getVariables(action)
{
	let returns = {};
	if(action.action === 'variable')
	{
		if(action.parameters.length===0)return console.log('Error: a variable must be passed for the variable command');
		let variableName = action.parameters[0];
		returns =
		{
			name:variableName,
			key:
				settings.variableMarker+
				crypto.genRandomString(20)+
				variableName+
				crypto.genRandomString(20)+
				settings.variableMarker
		};
	}
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
	fs.readFile
	(
		pagePath,
		async (err, data)=>
		{
			try
			{
				if(err)er(err);
				let result =
				{
					page:data,
					beforeFunctions:[],
					afterFunctions:[],
					variables:[]
				};
				if(data.includes(settings.startPrefix) && data.includes(settings.endPrefix))// only do this if it is doing special commands
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
						if(!settings.notReplaceFunctions.includes(actions.action))
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
						else if(actions.action==='variable')
						{
							let variableData = getVariables(actions);
							replacer = variableData.key;
							result.variables.push(variableData);
							//console.log(variableData);
						}
						else additionalData = getAdditionalData(actions);// maybe I will do async functions or something
						if(additionalData.beforeFunctions!=undefined)result.beforeFunctions = result.beforeFunctions.concat(additionalData.beforeFunctions);// add before functions to list
						if(additionalData.afterFunctions!=undefined)result.afterFunctions = result.afterFunctions.concat(additionalData.afterFunctions);// add after functions to list
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