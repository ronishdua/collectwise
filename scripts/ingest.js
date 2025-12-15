const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");
const { getDb, DB_PATH } = require("../src/db");

const DEFAULT_CSV = path.join(__dirname, "..", "data", "atlas_inventory.csv");
const csvPath = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_CSV;

function isBlank(v) {
  return v === undefined || v === null || String(v).trim() === "";
}

function toNumberOrNull(v) {
  if (isBlank(v)) return null;
  const n = Number(String(v).replace(/[$,]/g, "").trim());
  return Number.isFinite(n) ? n : NaN;
}

function main() {
  if (!fs.existsSync(csvPath)) {
    console.error(`CSV not found: ${csvPath}`);
    process.exit(1);
  }

  const csvText = fs.readFileSync(csvPath, "utf8");

  const records = parse(csvText, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  const db = getDb();

  const upsert = db.prepare(`
    INSERT INTO accounts (account_number, debtor_name, phone_number, balance, status, client_name, updated_at)
    VALUES (@account_number, @debtor_name, @phone_number, @balance, @status, @client_name, datetime('now'))
    ON CONFLICT(account_number) DO UPDATE SET
      debtor_name=excluded.debtor_name,
      phone_number=excluded.phone_number,
      balance=excluded.balance,
      status=excluded.status,
      client_name=excluded.client_name,
      updated_at=datetime('now');
  `);

  const tx = db.transaction((rows) => {
    let insertedOrUpdated = 0;
    let skipped = 0;
    const errors = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      const account_number = row.account_number ?? row["account_number"];
      if (isBlank(account_number)) {
        skipped++;
        errors.push({ row: i + 1, reason: "missing account_number" });
        continue;
      }

      const balanceParsed = toNumberOrNull(row.balance);
      if (Number.isNaN(balanceParsed)) {
        skipped++;
        errors.push({
          row: i + 1,
          account_number,
          reason: "non-numeric balance",
        });
        continue;
      }

      upsert.run({
        account_number: String(account_number).trim(),
        debtor_name: row.debtor_name ?? null,
        phone_number: row.phone_number ?? null,
        balance: balanceParsed,
        status: row.status ?? null,
        client_name: row.client_name ?? null,
      });

      insertedOrUpdated++;
    }

    return { insertedOrUpdated, skipped, errors };
  });

  const result = tx(records);

  console.log("Ingestion complete");
  console.log(`DB: ${DB_PATH}`);
  console.log(`Read rows: ${records.length}`);
  console.log(`Upserted: ${result.insertedOrUpdated}`);
  console.log(`Skipped: ${result.skipped}`);

  if (result.errors.length) {
    console.log("Errors (first 20):");
    console.log(result.errors.slice(0, 20));
  }
}

main();
