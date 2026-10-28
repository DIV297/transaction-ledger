import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

export const notFoundHandler = (req, _res, next) => {
  next(ApiError.notFound('ROUTE_NOT_FOUND', `Route ${req.method} ${req.originalUrl} not found`));
};

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, _req, res, _next) => {
  let error = err;

  // Malformed JSON body from express.json()
  if (err.type === 'entity.parse.failed') {
    error = ApiError.badRequest('INVALID_JSON', 'Request body contains invalid JSON');
  } else if (err.type === 'entity.too.large') {
    error = new ApiError(413, 'PAYLOAD_TOO_LARGE', 'Request body is too large');
  }

  if (!(error instanceof ApiError)) {
    console.error(err);
    error = new ApiError(500, 'INTERNAL_SERVER_ERROR', 'Something went wrong');
  }

  const body = {
    success: false,
    error: { code: error.code, message: error.message },
  };
  if (error.details !== undefined) body.error.details = error.details;
  if (env.nodeEnv === 'development' && error.statusCode === 500) body.error.stack = err.stack;

  res.status(error.statusCode).json(body);
};
