/**
 * @json-rpc
 * @description Название API
 * @param {object} parameters - params
 * @param {string} parameters.id - id
 * @param {string} [parameters.test] - test
 * @param {string|null} parameters.nullableString - nullable string
 * @param {number|null} parameters.nullableNumber - nullable number
 * @param {Date|null} parameters.nullableDate - nullable date
 * @param {string[]} parameters.array - array
 * @param {(1|2)} parameters.num - enum
 * @param {any} _xxx - xxx
 * @tags api, api-v1, api
 * @example
 * {
 *    "@context": "https://www.w3.org/ns/activitystreams",
 *    "type": "Note"
 * }
 * @returns {string}
 */
module.exports = (parameters, _xxx) => {
  return parameters.id;
};
