const ApiError = require("../utils/apiError");

const validate = (schema) => (req, _res, next) => {
  const result = schema.safeParse({
    body: req.body,
    params: req.params,
    query: req.query
  });

  if (!result.success) {
    const details = result.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ");
    return next(new ApiError(400, `Validation failed: ${details}`));
  }

  req.body = result.data.body;
  req.params = result.data.params;
  req.query = result.data.query;
  return next();
};

module.exports = validate;