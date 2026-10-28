import mongoose from 'mongoose';
import { toMinor } from '../utils/money.js';
import { applyEntry, runInTransaction } from './ledger.service.js';

/**
 * Moves money between two accounts as two ledger entries (debit on source,
 * credit on destination) sharing one transfer_id and reference_id.
 * Both legs run in a single DB transaction - a partial transfer is impossible.
 */
export async function createTransfer({ from_account_id, to_account_id, amount, description, reference_id }) {
  const transferId = new mongoose.Types.ObjectId();
  const amountMinor = toMinor(amount);

  const { debit, credit } = await runInTransaction(async (session) => {
    const debitEntry = await applyEntry(
      {
        accountId: from_account_id,
        type: 'debit',
        amountMinor,
        description: description || `Transfer to ${to_account_id}`,
        referenceId: reference_id,
        transferId,
      },
      session,
    );
    const creditEntry = await applyEntry(
      {
        accountId: to_account_id,
        type: 'credit',
        amountMinor,
        description: description || `Transfer from ${from_account_id}`,
        referenceId: reference_id,
        transferId,
      },
      session,
    );
    return { debit: debitEntry, credit: creditEntry };
  });

  return {
    transfer_id: transferId.toString(),
    from_account_id,
    to_account_id,
    amount,
    reference_id,
    debit_transaction: debit.toJSON(),
    credit_transaction: credit.toJSON(),
  };
}
