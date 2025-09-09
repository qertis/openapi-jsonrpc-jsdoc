/**
 * @description Test API with optional parameters for testing
 * @param {object} parameters - params  
 * @param {string} parameters.required_param - required parameter
 * @param {number} [parameters.optional_param] - optional parameter
 * @param {boolean} [parameters.another_optional] - another optional parameter
 * @example
 * {
 *    "method": "test-optional",
 *    "id": 1,
 *    "jsonrpc": "2.0",
 *    "params": {
 *      "required_param": "test"
 *    }
 * }
 */
module.exports = (parameters) => {
  return parameters;
};