import { z } from 'zod';
import { amount, description, objectId, referenceId } from './common.validator.js';

export const createTransferBody = z
  .object({
    from_account_id: objectId('from_account_id'),
    to_account_id: objectId('to_account_id'),
    amount,
    description,
    reference_id: referenceId,
  })
  .strict()
  .refine((body) => body.from_account_id !== body.to_account_id, {
    message: 'from_account_id and to_account_id must be different',
    path: ['to_account_id'],
  });
