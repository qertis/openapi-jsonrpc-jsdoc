/**
 * @description Название API
 * @param {object} parameters - params
 * @param {string} parameters.id - id
 * @example
 * {
 *    "@context": "https://www.w3.org/ns/activitystreams",
 *    "type": "Note"
 * }
 */
module.exports = (parameters) => {
  return parameters.id;
};
