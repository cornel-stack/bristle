// BlogPostBody — branches on article.stubBody.
//
// stubBody === false (featured article only this slice): renders the 2-paragraph
// lead followed by the 4 numbered sections; each section emits a
// <section id={section.id} data-blog-section={section.id}> wrapper carrying
// the IntersectionObserver marker BlogRailToc queries. An InlinePullQuote
// renders BETWEEN paragraph index 0 and 1 of its host section when present;
// an InlineFigure renders AFTER all paragraphs of its host section.
//
// stubBody === true (6 stubs): renders only article.body.stubLead as a
// single serif paragraph + "Full article forthcoming." caption in italic
// ink-secondary. NO <section data-blog-section> elements emitted on stubs
// (verifiable by curl-grep on each stub route — SC-026).
//
// This component MUST NOT reference figure.placeholderText — that field
// lives on the BlogFigure object as developer-facing data; InlineFigure
// (T006) reads only `eyebrow` and `caption`. Verified by grep.

import { Fragment } from "react";

import type { BlogArticle } from "./types";
import { InlineFigure } from "./inline-figure";
import { InlinePullQuote } from "./inline-pull-quote";

export function BlogPostBody({ article }: { article: BlogArticle }) {
  if (article.stubBody) {
    return (
      <div className="flex flex-col gap-grid">
        {article.body.stubLead && (
          <p className="font-serif text-body-lg text-text-primary">
            {article.body.stubLead}
          </p>
        )}
        <p className="italic text-body-md text-text-secondary">
          Full article forthcoming.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-section">
      {/* 2-paragraph lead before any <section>. */}
      <div className="flex flex-col gap-grid">
        {article.body.lead.map((paragraph, index) => (
          <p
            key={index}
            className="font-serif text-body-lg text-text-primary"
          >
            {paragraph}
          </p>
        ))}
      </div>
      {/* Numbered sections — each gets the [data-blog-section] IO marker. */}
      {article.sections.map((section) => (
        <section
          key={section.id}
          id={section.id}
          data-blog-section={section.id}
          className="scroll-mt-section"
        >
          <h2 className="font-serif text-h2 text-text-primary">
            {section.title}
          </h2>
          <div className="mt-grid flex flex-col gap-grid">
            {section.paragraphs.map((paragraph, index) => (
              <Fragment key={index}>
                <p className="font-serif text-body-lg text-text-primary">
                  {paragraph}
                </p>
                {/* Inline pull-quote renders BETWEEN paragraph index 0 and 1. */}
                {section.pullQuote && index === 0 && (
                  <InlinePullQuote quote={section.pullQuote} />
                )}
              </Fragment>
            ))}
            {/* Inline figure renders AFTER all paragraphs. */}
            {section.figure && <InlineFigure figure={section.figure} />}
          </div>
        </section>
      ))}
    </div>
  );
}
