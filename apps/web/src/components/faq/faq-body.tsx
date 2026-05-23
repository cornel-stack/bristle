import { FaqAccordion } from "./accordion";
import { FaqScrollSpyRail } from "./scroll-spy-rail";
import { StillStuckCard } from "./still-stuck-card";

export function FaqBody() {
  return (
    <section className="mx-auto max-w-5xl px-grid pb-section">
      <div className="grid gap-grid md:grid-cols-[16rem_1fr] md:gap-section">
        {/* Left column at desktop. At mobile, the rail renders its own
            horizontal pill row internally and the Still-Stuck card moves
            below the accordion (see the md:hidden block below). */}
        <div>
          <FaqScrollSpyRail />
          <div className="hidden md:mt-card md:block">
            <StillStuckCard />
          </div>
        </div>
        <div>
          <FaqAccordion />
        </div>
        {/* Mobile-only Still-Stuck card after accordion. */}
        <div className="md:hidden">
          <StillStuckCard />
        </div>
      </div>
    </section>
  );
}
