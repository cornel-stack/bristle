// Generates the canonical raw_items contract artifact from the Drizzle schema —
// the single reference both (a) the live DB (the Python drift test, Batch B) and
// (b) the Python RAW_ITEMS_COLUMNS are checked against (Decision 2, the TS↔Python
// seam). Pure: reads the Drizzle table object, writes JSON. NO database touched.
//
// Run: `pnpm --filter @bristle/db db:contract`. CHAINED into `db:generate` so a
// schema change to raw_items regenerates the contract in the same step — it
// cannot silently go stale (the drift test is the backstop, not the first line).
import { mkdirSync, writeFileSync } from "node:fs";

import { getTableConfig } from "drizzle-orm/pg-core";

import { rawItems } from "../src/pipeline-schema";

const cfg = getTableConfig(rawItems);

// Types are drizzle getSQLType() (e.g. "uuid", "text", "timestamp with time
// zone", "jsonb") — directly comparable to Postgres information_schema.data_type.
const columns = cfg.columns
  .map((c) => ({
    name: c.name,
    type: c.getSQLType(),
    notNull: c.notNull,
    primaryKey: c.primary,
    unique: c.isUnique ?? false,
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

// Inline column .unique() (content_hash) lives on the column; table-level
// unique().on() lives in uniqueConstraints. Capture both, normalized.
const uniqueConstraints = [
  ...cfg.columns
    .filter((c) => c.isUnique)
    .map((c) => ({ name: c.uniqueName ?? `${cfg.name}_${c.name}_unique`, columns: [c.name] })),
  ...cfg.uniqueConstraints.map((u) => ({ name: u.name, columns: u.columns.map((c) => c.name) })),
].sort((a, b) => a.name.localeCompare(b.name));

const indexes = cfg.indexes
  .map((i) => ({
    name: i.config.name,
    columns: i.config.columns.map((c) => ("name" in c ? c.name : String(c))),
    unique: i.config.unique ?? false,
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

const contract = { table: cfg.name, columns, uniqueConstraints, indexes };

const dir = new URL("../contracts/", import.meta.url);
mkdirSync(dir, { recursive: true });
writeFileSync(
  new URL("raw_items.contract.json", dir),
  JSON.stringify(contract, null, 2) + "\n",
);
console.log(
  `wrote contracts/raw_items.contract.json — ${columns.length} columns, ${uniqueConstraints.length} unique, ${indexes.length} indexes`,
);
