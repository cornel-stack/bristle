// Dynamic /problems/[slug] route. generateStaticParams enumerates the 5
// shippable slugs from the SAMPLE_PROBLEMS data store at build time, so
// each route prerenders as ● SSG. generateMetadata returns per-problem
// Open Graph metadata. Unknown slugs invoke notFound() → HTTP 404 (slice-010
// /blog/[slug] pattern).
//
// Next.js 15 async-params: `params` is a Promise<{slug: string}> in both
// generateMetadata and the default-export page component.

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SITE_URL } from "@bristle/shared";
import { SAMPLE_PROBLEMS } from "@/components/problem/sample-problems";
import { ProblemLayout } from "@/components/problem/problem-layout";

const DESCRIPTION_MAX = 155;
const STUB_DESCRIPTION = "Sample problem report — full report forthcoming.";

function truncateDescription(text: string): string {
  if (text.length <= DESCRIPTION_MAX) return text;
  return text.slice(0, DESCRIPTION_MAX - 3).replace(/\s+\S*$/, "") + "…";
}

export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  return SAMPLE_PROBLEMS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const problem = SAMPLE_PROBLEMS.find((p) => p.slug === slug);
  if (!problem) return { title: "Not found — Bristle" };

  const title = `${problem.title} — Bristle`;
  const description = problem.stubBody ? STUB_DESCRIPTION : truncateDescription(problem.lead);
  const url = `${SITE_URL}/problems/${problem.slug}`;

  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      url,
      images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630 }],
    },
  };
}

export default async function ProblemDetailPage(
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const problem = SAMPLE_PROBLEMS.find((p) => p.slug === slug);
  if (!problem) notFound();
  return <ProblemLayout problem={problem} />;
}
