import { z } from 'zod';
import { TRANSACTION_TYPES } from '../models/transaction.model.js';
import { amount, description, objectId, referenceId } from './common.validator.js';

const transactionType = z.enum(TRANSACTION_TYPES, {
  errorMap: () => ({ message: `type must be one of: ${TRANSACTION_TYPES.join(', ')}` }),
});

export const createTransactionBody = z
  .object({
    account_id: objectId('account_id'),
    type: transactionType,
    amount,
    description,
    reference_id: referenceId,
  })
  .strict();

const positiveIntParam = (field, { max } = {}) =>
  z
    .string()
    .regex(/^\d+$/, `${field} must be a positive integer`)
    .transform(Number)
    .refine((n) => n >= 1, `${field} must be at least 1`)
    .refine((n) => !max || n <= max, `${field} must be at most ${max}`);

export const MAX_PAGE_SIZE = 100;

export const listTransactionsQuery = z.object({
  type: transactionType.optional(),
  page: positiveIntParam('page').default('1'),
  limit: positiveIntParam('limit', { max: MAX_PAGE_SIZE }).default('10'),
});
