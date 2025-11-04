const errorHandler = (err, req, res, next) => {
  const status = err.statusCode || 500;
  const code = err.code || "SERVER_ERROR";
  const message = err.message || "Something went wrong";

  res.status(status).json({
    success: false,
    error: { code, message },
  });
};

module.exports = errorHandler;
