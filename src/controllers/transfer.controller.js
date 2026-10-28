import * as transferService from '../services/transfer.service.js';
import { sendSuccess } from '../utils/response.js';

export async function createTransfer(req, res) {
  const transfer = await transferService.createTransfer(req.validated.body);
  sendSuccess(res, transfer, 201);
}
