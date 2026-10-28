import * as accountService from '../services/account.service.js';
import * as transactionService from '../services/transaction.service.js';
import { sendSuccess } from '../utils/response.js';

export async function createAccount(req, res) {
  const account = await accountService.createAccount(req.validated.body);
  sendSuccess(res, account, 201);
}

export async function getAccount(req, res) {
  const account = await accountService.getAccountById(req.validated.params.id);
  sendSuccess(res, account);
}

export async function getBalance(req, res) {
  const balance = await accountService.getAccountBalance(req.validated.params.id);
  sendSuccess(res, balance);
}

export async function listTransactions(req, res) {
  const { items, pagination } = await transactionService.listTransactions(
    req.validated.params.id,
    req.validated.query,
  );
  sendSuccess(res, items, 200, { pagination });
}
