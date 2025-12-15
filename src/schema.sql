CREATE TABLE IF NOT EXISTS accounts (
  account_number TEXT PRIMARY KEY,
  debtor_name    TEXT,
  phone_number   TEXT,
  balance        REAL,
  status         TEXT,
  client_name    TEXT,
  updated_at     TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_accounts_phone ON accounts(phone_number);
