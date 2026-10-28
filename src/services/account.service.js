import { Account } from '../models/account.model.js';
import { ApiError } from '../utils/ApiError.js';
import { fromMinor } from '../utils/money.js';

export const accountNotFound = (id) => ApiError.notFound('ACCOUNT_NOT_FOUND', `Account ${id} not found`);

export async function createAccount({ name }) {
  // balance is intentionally not accepted from the caller - it always starts at 0
  const account = await Account.create({ name });
  return account.toJSON();
}

export async function getAccountById(id) {
  const account = await Account.findById(id);
  if (!account) throw accountNotFound(id);
  return account.toJSON();
}

export async function getAccountBalance(id) {
  const account = await Account.findById(id, { balance: 1 }).lean();
  if (!account) throw accountNotFound(id);
  return { account_id: account._id.toString(), balance: fromMinor(account.balance) };
}

export async function assertAccountExists(id) {
  if (!(await Account.exists({ _id: id }))) throw accountNotFound(id);
}
