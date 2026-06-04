// Synthesis tab — the editorial paragraphs (serif body/lg per §4.2). The seed
// stores paragraphs separated by blank lines.
export function SynthesisPanel({ synthesis }: { synthesis: string | null }) {
  if (!synthesis) {
    return <p className="text-body-md text-text-secondary">No synthesis yet.</p>;
  }
  return (
    <div className="max-w-prose space-y-4">
      {synthesis.split(/\n\n+/).map((para, i) => (
        <p key={i} className="font-serif text-body-lg text-text-primary">
          {para}
        </p>
      ))}
    </div>
  );
}
