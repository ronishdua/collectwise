# CollectWise Account Lookup Service

This repository contains a lightweight service that ingests an Atlas inventory CSV and exposes an HTTP endpoint to look up debtor accounts by `account_number`.

The service is designed to be simple, repeatable, and easy to run locally.

---

## Tech Stack

- Node.js
- Express
- SQLite (file-based)
- better-sqlite3
- csv-parse

---

## Setup

### Requirements
- Node.js 18+

### Install dependencies
```bash
npm install
```

---

## CSV Ingestion

The ingestion script reads an Atlas inventory CSV and loads it into a SQLite database.

### Default CSV path
```
data/atlas_inventory.csv
```

### Run ingestion (default path)
```bash
npm run ingest
```

### Run ingestion with a custom CSV path
```bash
npm run ingest -- /full/path/to/atlas_inventory.csv
```

### Ingestion behavior

- `account_number` is required
- `balance` must be numeric
- Rows missing `account_number` are skipped
- Rows with invalid `balance` values are skipped
- Duplicate `account_number` values are handled using **UPSERT**
  - The most recent row in the CSV overwrites previous data

After ingestion, a summary is printed showing:
- Total rows read
- Rows inserted or updated
- Rows skipped and reasons

---

## Database

- SQLite database stored at:
  ```
  data/collectwise.db
  ```
- Schema is initialized automatically on first run using `schema.sql`
- `account_number` is the primary key

---

## API

### Start the server
```bash
npm run start
```

The server runs on:
```
http://localhost:3000
```

### Health check
```bash
GET /health
```

### Account lookup (path param)
```bash
GET /accounts/:accountNumber
```

Example:
```bash
curl http://localhost:3000/accounts/10001
```

### Account lookup (query param)
```bash
GET /accounts?account_number=10001
```

### Successful response example
```json
{
  "account_number": "10001",
  "debtor_name": "John Smith",
  "phone_number": "+1-202-555-0101",
  "balance": 1240.55,
  "status": "Active",
  "client_name": "Atlas Capital"
}
```

### Not found response
```json
{
  "error": "account not found",
  "account_number": "99999"
}
```

---

## Notes

- The ingestion script can be run multiple times as new CSVs are provided.
- The database is updated deterministically based on `account_number`.
- This service is intentionally lightweight and designed for clarity and reliability.

---

## Files of Interest

- `scripts/ingest.js` – CSV ingestion logic
- `src/server.js` – Express API
- `src/db.js` – Database initialization
- `src/schema.sql` – SQLite schema
