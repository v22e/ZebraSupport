module.exports = (error, _req, res, _next) => {
  const statusCode = error.statusCode || 500;
  const message = statusCode === 500 ? "Internal Server Error" : error.message;

  if (statusCode === 500) {
    console.error(error);
  }

  const payload = {
    error: message
  };

  if (error.details && typeof error.details === "object") {
    Object.assign(payload, error.details);
  }

  return res.status(statusCode).json(payload);
};
