import { z } from 'zod';

// .strict() -> unknown keys (balance, id, created_at, ...) are rejected, so the
// client can never set the initial balance or system-generated fields.
export const createAccountBody = z
  .object({
    name: z
      .string({ required_error: 'name is required', invalid_type_error: 'name must be a string' })
      .trim()
      .min(1, 'name is required')
      .max(100, 'name must be at most 100 characters'),
  })
  .strict();
