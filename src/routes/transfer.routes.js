import { Router } from 'express';
import * as transferController from '../controllers/transfer.controller.js';
import { validate } from '../middlewares/validate.js';
import { createTransferBody } from '../validators/transfer.validator.js';

const router = Router();

router.post('/', validate({ body: createTransferBody }), transferController.createTransfer);

export default router;
