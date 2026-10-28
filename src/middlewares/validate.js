import { ApiError } from '../utils/ApiError.js';

/**
 * Validates req.params / req.query / req.body against zod schemas.
 * Parsed (trimmed, coerced, defaulted) values are exposed on req.validated.
 */
export const validate =
  (schemas) =>
  (req, _res, next) => {
    req.validated = {};
    const errors = [];

    for (const source of ['params', 'query', 'body']) {
      if (!schemas[source]) continue;
      const result = schemas[source].safeParse(req[source] ?? {});
      if (result.success) {
        req.validated[source] = result.data;
      } else {
        errors.push(
          ...result.error.issues.map((issue) => ({
            location: source,
            field: issue.path.join('.') || null,
            message:
              issue.code === 'unrecognized_keys'
                ? `Unknown field(s) not allowed: ${issue.keys.join(', ')}`
                : issue.message,
          })),
        );
      }
    }

    if (errors.length) {
      return next(ApiError.badRequest('VALIDATION_ERROR', 'Request validation failed', errors));
    }
    next();
  };
