import * as transactionService from '../services/transaction.service.js';
import { sendSuccess } from '../utils/response.js';

export async function createTransaction(req, res) {
  const transaction = await transactionService.createTransaction(req.validated.body);
  sendSuccess(res, transaction, 201);
}
