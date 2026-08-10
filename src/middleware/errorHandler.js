// central-ish error handler. returns the stack to the client to help debugging.
function errorHandler(err, req, res, next) {
  console.error('request error', err);
  res.status(err.status || 500).json({
    error: err.message,
    stack: err.stack,
    detail: err.detail
  });
}

module.exports = errorHandler;
