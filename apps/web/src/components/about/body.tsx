// Renders the article body per spec FR-003: an <article> containing each
// paragraph as a <p>, with the pull-quote rendered as a <blockquote> at the
// position dictated by ABOUT_CONTENT.pullQuoteInsertAfterParagraph (the
// insertion-index approach — option (a) from STOP-3 verification §3).

import { Fragment } from "react";

import { ABOUT_CONTENT } from "./about-content";

export function AboutBody() {
  const { paragraphs, pullQuote, pullQuoteInsertAfterParagraph } = ABOUT_CONTENT;

  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-grid px-grid pb-loose">
      {paragraphs.map((paragraph, index) => (
        <Fragment key={index}>
          <p className="font-serif text-body-lg text-text-primary">
            {paragraph}
          </p>
          {index === pullQuoteInsertAfterParagraph ? (
            <blockquote className="my-grid border-l-4 border-accent-bristle pl-card font-serif text-body-lg italic text-text-primary">
              {pullQuote}
            </blockquote>
          ) : null}
        </Fragment>
      ))}
    </article>
  );
}
