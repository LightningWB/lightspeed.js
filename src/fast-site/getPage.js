const fs = require('fs');
const path = require('path');
const settings =
{
	startPrefix:'@&',// reminded that changing these require you to change regex bellow
	endPrefix:'&@',
	startParam:'[',
	endParam:']',
	splitter:'|',
	functionActions:['function']
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
	return {action:action.toLowerCase().trim(), parameters:params}
}

async function getReplacer(options, action, err)
{
	//console.log(action);
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

function getFunctions(action)
{
	//console.log(action);
	switch (action.action)
	{
		case 'function':
			functions = action.parameters;
			return functions;
		default:// let it show as what they entered if no action is available
			return action.action+settings.startParam+action.parameters.join(settings.splitter)+settings.endParam;
	}
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
				if(data.includes(settings.startPrefix) && data.includes(settings.endPrefix))// only do this if it is doing special commands
				{
					let functions = [];
					while(data.includes(settings.startPrefix) && data.includes(settings.endPrefix))// turns out that doing a while loop and adding data to it automatically parses included files
					{
						data = data.toString();
						const startIndex = data.indexOf(settings.startPrefix);
						const endIndex = data.indexOf(settings.endPrefix);
						const action = data.substring(startIndex+settings.startPrefix.length, endIndex);
						let replacer = '';
						const actions = parseAction(action);
						if(!settings.functionActions.includes(actions.action))
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
						else functions = getFunctions(actions);// maybe I will do async functions or something
						data = data.substr(0, startIndex) + replacer + data.substr(endIndex+settings.endPrefix.length, data.length-startIndex);// insert the new stuff
					}
					data = data.replace(/@\\&/g, settings.startPrefix).replace(/&\\@/g, settings.endPrefix);
					cb(
						{
							page:data,
							functions:functions
						}
					);
				}
				else 
				cb(
					{
						page:data,
						functions:[]
					}
				);
			}
			catch(err)
			{
				er(err)
			}
		}
	)
}