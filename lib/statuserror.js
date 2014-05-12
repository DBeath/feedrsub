/**
 * An Error containing an HTTP StatusCode
 *
 * @class StatusError
 * @constructor
 */
function StatusError(code, message) {
  this.statusCode = code || 500;
  this.message = message || 'Something went wrong';
};
StatusError.prototype = new Error();
StatusError.prototype.constructor = StatusError;

module.exports = StatusError;