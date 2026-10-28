import mongoose from 'mongoose';
import { env } from './env.js';
import { Account } from '../models/account.model.js';
import { Transaction } from '../models/transaction.model.js';

export async function connectDB() {
  mongoose.set('strictQuery', true);
  await mongoose.connect(env.mongoUri, { dbName: env.mongoDbName });

  // Make sure collections + indexes (incl. unique account_id/reference_id) exist
  // before serving traffic; collections can't be implicitly created inside some transactions.
  await Promise.all([Account.init(), Transaction.init()]);

  console.log(`MongoDB connected (db: ${env.mongoDbName})`);
}

export async function disconnectDB() {
  await mongoose.disconnect();
}
