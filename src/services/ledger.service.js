import mongoose from 'mongoose';
import { Account } from '../models/account.model.js';
import { Transaction } from '../models/transaction.model.js';
import { ApiError } from '../utils/ApiError.js';
import { fromMinor } from '../utils/money.js';
import { accountNotFound } from './account.service.js';

const DUPLICATE_KEY_ERROR = 11000;

const duplicateTransaction = (existing) =>
  ApiError.conflict(
    'DUPLICATE_TRANSACTION',
    `A transaction with reference_id '${existing.reference_id}' already exists for this account`,
    { existing_transaction: existing.toJSON() },
  );

/**
 * Runs `work(session)` inside a MongoDB multi-document transaction.
 * Either every write inside it is committed, or none is. Transient errors
 * (e.g. write conflicts from concurrent requests on the same account) are retried by the driver.
 */
export async function runInTransaction(work) {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await work(session);
    });
    return result;
  } finally {
    await session.endSession();
  }
}

/**
 * Applies a single ledger entry (credit/debit) to an account. Must be called inside a transaction.
 *
 * 1. Rejects a duplicate reference_id for the account (idempotency).
 * 2. Atomically adjusts the balance; for debits the `balance >= amount` guard lives in the
 *    update filter itself, so concurrent debits can never push the balance below 0.
 * 3. Inserts the immutable transaction record.
 */
export async function applyEntry(
  { accountId, type, amountMinor, description = '', referenceId, transferId = null },
  session,
) {
  const existing = await Transaction.findOne({ account_id: accountId, reference_id: referenceId }).session(
    session,
  );
  if (existing) throw duplicateTransaction(existing);

  const filter = { _id: accountId };
  if (type === 'debit') filter.balance = { $gte: amountMinor };
  const delta = type === 'credit' ? amountMinor : -amountMinor;

  const account = await Account.findOneAndUpdate(
    filter,
    { $inc: { balance: delta } },
    { new: true, session, projection: { balance: 1 } },
  );

  if (!account) {
    const current = await Account.findById(accountId, { balance: 1 }).session(session).lean();
    if (!current) throw accountNotFound(accountId);
    throw ApiError.unprocessable('INSUFFICIENT_BALANCE', 'Insufficient balance for this debit', {
      account_id: accountId,
      balance: fromMinor(current.balance),
      requested_amount: fromMinor(amountMinor),
    });
  }

  try {
    const [transaction] = await Transaction.create(
      [
        {
          account_id: accountId,
          type,
          amount: amountMinor,
          description,
          reference_id: referenceId,
          balance_after: account.balance,
          transfer_id: transferId,
        },
      ],
      { session },
    );
    return transaction;
  } catch (err) {
    // Unique index (account_id, reference_id) is the final safety net for races
    if (err?.code === DUPLICATE_KEY_ERROR) {
      throw ApiError.conflict(
        'DUPLICATE_TRANSACTION',
        `A transaction with reference_id '${referenceId}' already exists for this account`,
      );
    }
    throw err;
  }
}
