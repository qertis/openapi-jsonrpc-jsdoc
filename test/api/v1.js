/**
 * @json-rpc
 * @description Название API
 * @param {object} parameters - params
 * @param {string} parameters.id - id
 * @param {string} [parameters.test] - test
 * @param {string[]} parameters.array - array
 * @tags api, api-v1, api
 * @example
 * {
 *    "@context": "https://www.w3.org/ns/activitystreams",
 *    "type": "Note"
 * }
 */
module.exports = (parameters) => {
  return parameters.id;
};
