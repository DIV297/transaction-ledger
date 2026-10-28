import mongoose from 'mongoose';
import { fromMinor } from '../utils/money.js';

const accountSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 100,
    },
    // Stored in minor units. Only ever changed via atomic $inc inside a DB transaction.
    balance: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      validate: { validator: Number.isInteger, message: 'balance must be an integer (minor units)' },
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    versionKey: false,
    toJSON: {
      transform: (_doc, ret) => ({
        id: ret._id.toString(),
        name: ret.name,
        balance: fromMinor(ret.balance),
        created_at: ret.created_at,
        updated_at: ret.updated_at,
      }),
    },
  },
);

export const Account = mongoose.model('Account', accountSchema);
