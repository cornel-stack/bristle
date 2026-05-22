import Link from "next/link";

const TIERS = [
  { name: "Starter", price: "$29", desc: "Five categories, daily digest, CSV export." },
  { name: "Pro", price: "$79", desc: "Unlimited categories, instant alerts, API comparisons." },
  { name: "Team", price: "$199", desc: "Five seats, shared collections, Slack and webhooks." },
];

// Deliberately-dark band on the otherwise-light page: a scoped data-theme="dark"
// makes the token utilities resolve to their Editorial Dark values within this
// subtree only. No document-root theme marker is set (next-themes is a later slice).
export function PricingTeaser() {
  return (
    <section data-theme="dark" className="bg-surface-canvas">
      <div className="mx-auto grid max-w-6xl gap-loose px-grid py-section md:grid-cols-2">
        <div>
          <p className="text-body-sm font-medium uppercase tracking-wide text-text-tertiary">Pricing</p>
          <h2 className="mt-snug font-serif text-h2 text-text-primary">
            One price for serious research. One for casual.
          </h2>
          <p className="mt-grid max-w-xl text-body-md text-text-secondary">
            Starter for solo builders. Pro for shipping founders. Team for agencies and innovation labs.
          </p>
          <Link
            href="/pricing"
            className="mt-loose inline-block rounded-button border border-border-strong px-grid py-2 text-body-sm font-medium text-text-primary"
          >
            See full pricing →
          </Link>
        </div>
        <dl className="flex flex-col gap-grid">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className="grid grid-cols-3 items-baseline gap-grid border-b border-border-default pb-grid"
            >
              <dt className="text-body-sm font-medium uppercase tracking-wide text-text-tertiary">{tier.name}</dt>
              <div className="flex items-baseline gap-1">
                <span className="font-serif text-h2 text-text-primary">{tier.price}</span>
                <span className="text-body-sm text-text-tertiary">/mo</span>
              </div>
              <dd className="text-body-sm text-text-secondary">{tier.desc}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
