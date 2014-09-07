var http = require('http');

/**
 * An Error containing an HTTP StatusCode
 *
 * @class StatusError
 * @constructor
 * @param [code] {Number} HTTP StatusCode for the error
 * @param [message] {String} Error message
 */
function StatusError(code, message) {
  this.statusCode = code || 500;
  if (message) {
  	this.message = message;
  } else {
  	this.message = http.STATUS_CODES[code];
  };
};
StatusError.prototype = new Error();
StatusError.prototype.constructor = StatusError;

module.exports.StatusError = StatusError;

/** 
 * Handles StatusErrors
 *
 * @method StatusErrorHandler
 */
function StatusErrorHandler(err, req, res, next) {
  if (!err.statusCode) {
    return next(err);
  };
  console.error(err);
  return res.status(err.statusCode).send(err.message);
};

module.exports.StatusErrorHandler = StatusErrorHandler;

/** 
 * Handles errors without a set statuscode
 *
 * @method ErrorHandler
 */
function ErrorHandler(err, req, res, next) {
  console.error(err);
  return res.status(500).send(err.message);
};

module.exports.ErrorHandler = ErrorHandler;