import { z } from 'zod';
import { hasAtMostTwoDecimals } from '../utils/money.js';

export const MAX_AMOUNT = 1_000_000_000; // 1 billion per single transaction

export const objectId = (field) =>
  z
    .string({ required_error: `${field} is required`, invalid_type_error: `${field} must be a string` })
    .regex(/^[a-f\d]{24}$/i, `${field} must be a valid id`);

export const amount = z
  .number({ required_error: 'amount is required', invalid_type_error: 'amount must be a number' })
  .finite('amount must be a finite number')
  .positive('amount must be greater than 0')
  .max(MAX_AMOUNT, `amount must not exceed ${MAX_AMOUNT}`)
  .refine(hasAtMostTwoDecimals, 'amount can have at most 2 decimal places');

export const referenceId = z
  .string({ required_error: 'reference_id is required', invalid_type_error: 'reference_id must be a string' })
  .trim()
  .min(1, 'reference_id is required')
  .max(100, 'reference_id must be at most 100 characters');

export const description = z
  .string({ invalid_type_error: 'description must be a string' })
  .trim()
  .max(255, 'description must be at most 255 characters')
  .optional();

export const accountIdParams = z.object({ id: objectId('account id') });
