# Transaction Ledger API

A REST API for a simple transaction ledger: create accounts, post credit and debit transactions, check balances, browse transaction history, and transfer money between accounts. Every operation is atomic and safe under concurrent requests.

**Tech stack:** Node.js · Express 5 · MongoDB (Mongoose) · Zod

## Features

- Create accounts (balance always starts at 0)
- Credit and debit transactions, with insufficient balance protection
- Idempotent transactions through a `reference_id` that is unique per account
- Balance lookup
- Transaction history with type filter, pagination and latest-first sorting
- Money transfer between accounts (bonus), fully atomic
- Immutable, append-only transactions
- Consistent error format with clear error codes

## Documentation

- [API Documentation](docs/API.md): endpoints, payloads, responses and error codes
- [Assumptions & Design Decisions](docs/ASSUMPTIONS.md)

## Getting started

### Prerequisites

- Node.js 18 or later
- A MongoDB **replica set**, needed for multi-document transactions. A free MongoDB Atlas cluster works out of the box. For a local setup, run `mongod --replSet rs0` and then `rs.initiate()`.

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# then edit .env and set MONGODB_URI
```

| Variable | Description | Default |
|---|---|---|
| `PORT` | HTTP port | `3000` |
| `NODE_ENV` | `development` / `production` | `development` |
| `MONGODB_URI` | MongoDB connection string (replica set) | (required) |
| `MONGODB_DB_NAME` | Database name | `transaction_ledger` |

### Run

```bash
npm run dev     # development, auto-reload (nodemon)
npm start       # production
```

The server starts on `http://localhost:3000`. Check it with:

```bash
curl http://localhost:3000/health
```

Collections and indexes are created automatically on startup.

## Quick example

```bash
# Create an account
curl -X POST http://localhost:3000/api/accounts \
  -H 'Content-Type: application/json' -d '{"name":"Alice"}'

# Credit 100
curl -X POST http://localhost:3000/api/transactions \
  -H 'Content-Type: application/json' \
  -d '{"account_id":"<ID>","type":"credit","amount":100,"reference_id":"dep-1"}'

# Check balance
curl http://localhost:3000/api/accounts/<ID>/balance

# History (debits only, page 1)
curl "http://localhost:3000/api/accounts/<ID>/transactions?type=debit&page=1&limit=10"
```

## Project structure

```
.
├── server.js                  # Entry point: connect DB, start HTTP server, graceful shutdown
├── src/
│   ├── app.js                 # Express app: middlewares, routes, error handling
│   ├── config/
│   │   ├── env.js             # Env loading + validation
│   │   └── db.js              # MongoDB connection + index sync
│   ├── models/                # Mongoose schemas (constraints, indexes, immutability)
│   ├── validators/            # Zod request schemas
│   ├── middlewares/           # validate, error handler, 404
│   ├── routes/                # Route definitions (URL → validator → controller)
│   ├── controllers/           # HTTP layer: read the request, send the response
│   ├── services/              # Business logic
│   │   └── ledger.service.js  # Core: atomic entry posting inside a DB transaction
│   └── utils/                 # ApiError, money helpers, response helper
└── docs/
    ├── API.md
    └── ASSUMPTIONS.md
```

A request flows like this: **route → validate middleware → controller → service → model**. Every error ends up in the central error handler, which returns a consistent response.

## How data integrity is guaranteed

| Requirement | How |
|---|---|
| **Atomicity** | The balance update and the transaction insert run inside one MongoDB transaction (`session.withTransaction`). Transfers put both legs in the same transaction. |
| **No overdraft, even under concurrency** | The debit uses a conditional atomic update: `findOneAndUpdate({ _id, balance: { $gte: amount } }, { $inc: { balance: -amount } })`. |
| **No duplicate transactions** | A lookup before insert, backed by a **unique index** on `(account_id, reference_id)`. |
| **Immutability** | There are no update or delete routes. Schema fields are `immutable`, and update/delete query hooks on the model throw. |
| **Precise money** | Amounts are stored as integers in minor units, and at most 2 decimals are accepted. |
| **Balance consistency** | Only successful entries are stored, so `balance` = Σ credits − Σ debits. Each entry also stores `balance_after`. |
# transaction-ledger
