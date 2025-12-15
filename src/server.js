require("dotenv").config();
const express = require("express");
const { getDb } = require("./db");

const app = express();
const port = process.env.PORT || 3000;

const db = getDb();
const findByAccount = db.prepare(`
  SELECT account_number, debtor_name, phone_number, balance, status, client_name
  FROM accounts
  WHERE account_number = ?
`);

app.get("/health", (req, res) => res.json({ ok: true }));

// Option A: GET /accounts/:accountNumber
app.get("/accounts/:accountNumber", (req, res) => {
  const acct = String(req.params.accountNumber || "").trim();
  if (!acct)
    return res.status(400).json({ error: "account_number is required" });

  const row = findByAccount.get(acct);
  if (!row)
    return res
      .status(404)
      .json({ error: "account not found", account_number: acct });

  return res.json(row);
});

// Option B: GET /accounts?account_number=...
app.get("/accounts", (req, res) => {
  const acct = String(req.query.account_number || "").trim();
  if (!acct)
    return res
      .status(400)
      .json({ error: "account_number query param is required" });

  const row = findByAccount.get(acct);
  if (!row)
    return res
      .status(404)
      .json({ error: "account not found", account_number: acct });

  return res.json(row);
});

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
