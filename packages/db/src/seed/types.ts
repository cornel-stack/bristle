import { eq } from "drizzle-orm";
import { CompareCardSchema, isSourceKey, type CompareCard } from "@bristle/shared";

import type { getDb } from "../client";
import {
  existingSolutions,
  problemFrequencyPoints,
  problemPersonas,
  problemQuotes,
  problemRelated,
  problemSources,
  problems,
  wtpSignals,
} from "../schema";

type Db = ReturnType<typeof getDb>;

// TF-023: every time-derived fixture value is anchored to `now()` at seed time
// (one SEED_NOW for the whole run), so the demo always reads the design's relative
// times — "12m ago", "94 days since first seen" — regardless of view date, and a
// re-seed refreshes it. (Seed is a one-shot Node script; Date.now() is fine here.)
const SEED_NOW = Date.now();
const DAY_MS = 86_400_000;
export const minsAgo = (m: number): Date => new Date(SEED_NOW - m * 60_000);
export const hoursAgo = (h: number): Date => new Date(SEED_NOW - h * 3_600_000);
export const daysAgo = (d: number): Date => new Date(SEED_NOW - d * DAY_MS);
export const todayISO = (): string =>
  new Date(SEED_NOW).toISOString().slice(0, 10);
export const daysAgoISO = (d: number): string =>
  daysAgo(d).toISOString().slice(0, 10);

export interface ChildQuote {
  authorHandle: string;
  sourceKey: string;
  engagementValue?: number;
  engagementLabel?: string;
  rating?: number; // App Store star reviews carry this instead of engagement
  quoteText: string;
  sourceUrl?: string;
  postedAt?: Date;
  isWtpSignal?: boolean;
  statedPriceUsd?: number;
}

export interface FreqPoint {
  observedOn: string; // YYYY-MM-DD
  mentionCount: number;
  isThresholdMarker?: boolean;
}

// One problem's full child-row set (data-model.md §2). `compareCard` is validated
// against the shared Zod contract before write.
export interface ProblemFixture {
  slug: string;
  sources: { sourceKey: string; quoteCount: number }[];
  quotes: ChildQuote[];
  solutions: {
    name: string;
    priceRange?: string;
    matchType: string; // direct | adjacent | partial
    description?: string;
    mentionCount?: number;
  }[];
  wtp: {
    mentionCount: number;
    priceMinUsd?: number;
    priceMaxUsd?: number;
    medianUsd?: number;
    note?: string;
  } | null;
  personas: { label: string; count: number; percentage?: number }[];
  related: { label: string; targetSlug?: string }[];
  frequency: FreqPoint[];
  compareCard: CompareCard;
}

// Deterministic frequency series (no Math.random → idempotent). Ease-in growth
// from→to over `days` ending on endDate, with a small fixed wobble; optionally
// flags one date as the validation-threshold marker.
export function genFrequency(opts: {
  endDate: string;
  days: number;
  from: number;
  to: number;
  thresholdDate?: string;
}): FreqPoint[] {
  const { endDate, days, from, to, thresholdDate } = opts;
  const end = new Date(`${endDate}T00:00:00Z`);
  const points: FreqPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(end);
    d.setUTCDate(end.getUTCDate() - i);
    const t = days === 1 ? 1 : (days - 1 - i) / (days - 1);
    const base = from + (to - from) * t * t;
    const wobble = ((i * 7) % 5) - 2;
    const observedOn = d.toISOString().slice(0, 10);
    points.push({
      observedOn,
      mentionCount: Math.max(0, Math.round(base + wobble)),
      isThresholdMarker: thresholdDate === observedOn,
    });
  }
  return points;
}

// Replace-children writer (D6 idempotency): validates the fixture, deletes the
// problem's existing child rows, re-inserts, and writes compare_card. Scoped to
// the one problem id, so re-running converges with no duplication.
export async function seedProblemChildren(
  db: Db,
  fx: ProblemFixture,
  idBySlug: Map<string, string>,
): Promise<void> {
  const problemId = idBySlug.get(fx.slug);
  if (!problemId) throw new Error(`no seeded problem id for slug "${fx.slug}"`);

  CompareCardSchema.parse(fx.compareCard); // throws on drift from the contract
  for (const s of fx.sources) {
    if (!isSourceKey(s.sourceKey)) {
      throw new Error(`"${fx.slug}": invalid source key "${s.sourceKey}"`);
    }
  }
  for (const q of fx.quotes) {
    if (!isSourceKey(q.sourceKey)) {
      throw new Error(`"${fx.slug}": invalid quote source "${q.sourceKey}"`);
    }
  }

  await db.delete(problemSources).where(eq(problemSources.problemId, problemId));
  await db.delete(problemQuotes).where(eq(problemQuotes.problemId, problemId));
  await db
    .delete(existingSolutions)
    .where(eq(existingSolutions.problemId, problemId));
  await db.delete(wtpSignals).where(eq(wtpSignals.problemId, problemId));
  await db
    .delete(problemPersonas)
    .where(eq(problemPersonas.problemId, problemId));
  await db
    .delete(problemFrequencyPoints)
    .where(eq(problemFrequencyPoints.problemId, problemId));
  await db.delete(problemRelated).where(eq(problemRelated.problemId, problemId));

  if (fx.sources.length) {
    await db
      .insert(problemSources)
      .values(fx.sources.map((s) => ({ problemId, ...s })));
  }
  if (fx.quotes.length) {
    await db
      .insert(problemQuotes)
      .values(fx.quotes.map((q, i) => ({ problemId, ...q, position: i })));
  }
  if (fx.solutions.length) {
    await db
      .insert(existingSolutions)
      .values(fx.solutions.map((s, i) => ({ problemId, ...s, position: i })));
  }
  if (fx.wtp) {
    await db.insert(wtpSignals).values({ problemId, ...fx.wtp });
  }
  if (fx.personas.length) {
    await db
      .insert(problemPersonas)
      .values(fx.personas.map((p, i) => ({ problemId, ...p, position: i })));
  }
  if (fx.frequency.length) {
    await db.insert(problemFrequencyPoints).values(
      fx.frequency.map((f) => ({
        problemId,
        observedOn: f.observedOn,
        mentionCount: f.mentionCount,
        isThresholdMarker: f.isThresholdMarker ?? false,
      })),
    );
  }
  if (fx.related.length) {
    await db.insert(problemRelated).values(
      fx.related.map((r, i) => ({
        problemId,
        label: r.label,
        targetSlug: r.targetSlug ?? null,
        relatedProblemId: r.targetSlug
          ? (idBySlug.get(r.targetSlug) ?? null)
          : null,
        position: i,
      })),
    );
  }

  await db
    .update(problems)
    .set({ compareCard: fx.compareCard })
    .where(eq(problems.id, problemId));
}
