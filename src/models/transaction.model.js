import mongoose from 'mongoose';
import { fromMinor } from '../utils/money.js';

export const TRANSACTION_TYPES = Object.freeze(['credit', 'debit']);

const transactionSchema = new mongoose.Schema(
  {
    account_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      required: true,
      immutable: true,
    },
    type: { type: String, enum: TRANSACTION_TYPES, required: true, immutable: true },
    // Stored in minor units
    amount: {
      type: Number,
      required: true,
      min: 1,
      immutable: true,
      validate: { validator: Number.isInteger, message: 'amount must be an integer (minor units)' },
    },
    description: { type: String, trim: true, maxlength: 255, default: '', immutable: true },
    reference_id: { type: String, required: true, trim: true, maxlength: 100, immutable: true },
    // Account balance right after this entry was applied - handy for audits/statements
    balance_after: { type: Number, required: true, immutable: true },
    // Set only for entries created by a transfer; links the debit and credit legs
    transfer_id: { type: mongoose.Schema.Types.ObjectId, default: null, immutable: true },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
    versionKey: false,
    toJSON: {
      transform: (_doc, ret) => ({
        id: ret._id.toString(),
        account_id: ret.account_id.toString(),
        type: ret.type,
        amount: fromMinor(ret.amount),
        description: ret.description,
        reference_id: ret.reference_id,
        balance_after: fromMinor(ret.balance_after),
        transfer_id: ret.transfer_id ? ret.transfer_id.toString() : null,
        created_at: ret.created_at,
      }),
    },
  },
);

// Idempotency: a reference_id can be used only once per account (but reused across accounts)
transactionSchema.index({ account_id: 1, reference_id: 1 }, { unique: true });
// History queries: newest first, optionally filtered by type
transactionSchema.index({ account_id: 1, created_at: -1, _id: -1 });
transactionSchema.index({ account_id: 1, type: 1, created_at: -1, _id: -1 });

// Ledger entries are append-only. Block every update/delete path at the model level too.
const blockMutation = function () {
  throw new Error('Transactions are immutable and cannot be updated or deleted');
};
[
  'updateOne',
  'updateMany',
  'findOneAndUpdate',
  'replaceOne',
  'findOneAndReplace',
  'deleteOne',
  'deleteMany',
  'findOneAndDelete',
].forEach((op) => transactionSchema.pre(op, blockMutation));
transactionSchema.pre('save', function () {
  if (!this.isNew) blockMutation();
});

export const Transaction = mongoose.model('Transaction', transactionSchema);
