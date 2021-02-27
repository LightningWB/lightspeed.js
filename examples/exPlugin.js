/**
 * an example plugin to error every request and overwrite a return function
 */

module.exports.options = function(ops)
{
	ops.returnFunctions.returnTest=()=>'test plugin returned function';
}

module.exports.modifications = function(req, res)
{
	res.statusCode=302;
}