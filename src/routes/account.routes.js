import { Router } from 'express';
import * as accountController from '../controllers/account.controller.js';
import { validate } from '../middlewares/validate.js';
import { createAccountBody } from '../validators/account.validator.js';
import { accountIdParams } from '../validators/common.validator.js';
import { listTransactionsQuery } from '../validators/transaction.validator.js';

const router = Router();

router.post('/', validate({ body: createAccountBody }), accountController.createAccount);
router.get('/:id', validate({ params: accountIdParams }), accountController.getAccount);
router.get('/:id/balance', validate({ params: accountIdParams }), accountController.getBalance);
router.get(
  '/:id/transactions',
  validate({ params: accountIdParams, query: listTransactionsQuery }),
  accountController.listTransactions,
);

export default router;
