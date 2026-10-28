import { Transaction } from '../models/transaction.model.js';
import { toMinor } from '../utils/money.js';
import { assertAccountExists } from './account.service.js';
import { applyEntry, runInTransaction } from './ledger.service.js';

export async function createTransaction({ account_id, type, amount, description, reference_id }) {
  const transaction = await runInTransaction((session) =>
    applyEntry(
      {
        accountId: account_id,
        type,
        amountMinor: toMinor(amount),
        description,
        referenceId: reference_id,
      },
      session,
    ),
  );
  return transaction.toJSON();
}

export async function listTransactions(accountId, { type, page, limit }) {
  await assertAccountExists(accountId);

  const filter = { account_id: accountId };
  if (type) filter.type = type;

  const [items, totalRecords] = await Promise.all([
    Transaction.find(filter)
      .sort({ created_at: -1, _id: -1 }) // latest first; _id breaks ties for same-millisecond entries
      .skip((page - 1) * limit)
      .limit(limit),
    Transaction.countDocuments(filter),
  ]);

  return {
    items: items.map((t) => t.toJSON()),
    pagination: {
      page,
      limit,
      total_records: totalRecords,
      total_pages: Math.ceil(totalRecords / limit),
    },
  };
}
