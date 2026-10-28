import { Router } from 'express';
import * as transactionController from '../controllers/transaction.controller.js';
import { validate } from '../middlewares/validate.js';
import { createTransactionBody } from '../validators/transaction.validator.js';

const router = Router();

// Transactions are append-only: no PUT/PATCH/DELETE routes by design.
router.post('/', validate({ body: createTransactionBody }), transactionController.createTransaction);

export default router;
