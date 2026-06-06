// Generates the canonical contract artifacts from the Drizzle schema — the single
// reference both (a) the live DB (the Python drift test) and (b) the Python column
// specs are checked against (Decision 2, the TS↔Python seam). Pure: reads the
// Drizzle table objects, writes JSON. NO database touched.
//
// Run: `pnpm --filter @bristle/db db:contract`. CHAINED into `db:generate` so a
// schema change regenerates the contracts in the same step — they cannot silently
// go stale (the drift test is the backstop, not the first line).
//
// Covers EVERY pipeline-namespaced table (5.1 raw_items + 5.2 processed_items);
// add new ones to TABLES.
import { mkdirSync, writeFileSync } from "node:fs";

import { getTableConfig, type PgTable } from "drizzle-orm/pg-core";

import { processedItems, rawItems } from "../src/pipeline-schema";

const TABLES: PgTable[] = [rawItems, processedItems];

function buildContract(table: PgTable) {
  const cfg = getTableConfig(table);

  // Types are drizzle getSQLType() (e.g. "uuid", "text", "vector(1536)", "timestamp
  // with time zone") — comparable to Postgres introspection at the boundary.
  const columns = cfg.columns
    .map((c) => ({
      name: c.name,
      type: c.getSQLType(),
      notNull: c.notNull,
      primaryKey: c.primary,
      unique: c.isUnique ?? false,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Inline column .unique() lives on the column; table-level unique().on() lives in
  // uniqueConstraints. Capture both, normalized.
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
      // The access method (e.g. "hnsw") — null for the default btree.
      method: "method" in i.config ? ((i.config.method as string) ?? null) : null,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Foreign keys (the 5.2 raw_item_id FK) — table + columns + onDelete.
  const foreignKeys = cfg.foreignKeys
    .map((fk) => {
      const ref = fk.reference();
      return {
        name: fk.getName(),
        columns: ref.columns.map((c) => c.name).sort(),
        refTable: getTableConfig(ref.foreignTable).name,
        refColumns: ref.foreignColumns.map((c) => c.name).sort(),
        onDelete: fk.onDelete ?? null,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  return { table: cfg.name, columns, uniqueConstraints, indexes, foreignKeys };
}

const dir = new URL("../contracts/", import.meta.url);
mkdirSync(dir, { recursive: true });

for (const table of TABLES) {
  const contract = buildContract(table);
  writeFileSync(
    new URL(`${contract.table}.contract.json`, dir),
    JSON.stringify(contract, null, 2) + "\n",
  );
  console.log(
    `wrote contracts/${contract.table}.contract.json — ${contract.columns.length} columns, ` +
      `${contract.uniqueConstraints.length} unique, ${contract.indexes.length} indexes, ` +
      `${contract.foreignKeys.length} fks`,
  );
}
