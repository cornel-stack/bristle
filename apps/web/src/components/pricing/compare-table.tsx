import { Check } from "lucide-react";

import { COMPARE_ROWS, type CompareCell } from "./compare-data";

function renderCell(cell: CompareCell) {
  if (typeof cell === "string") return cell;
  if (cell.kind === "check") {
    return (
      <Check
        aria-label="included"
        className="mx-auto size-4 stroke-[1.5] text-accent-validated"
      />
    );
  }
  return "—"; // em-dash
}

export function CompareTable() {
  return (
    <section className="mx-auto max-w-5xl px-grid py-section">
      <p className="text-body-sm font-medium uppercase tracking-wide text-text-secondary">
        COMPARE IN DETAIL
      </p>
      <h2 className="mt-grid font-serif text-h2 text-text-primary">
        Compare plans, feature by feature.
      </h2>
      <div className="mt-card overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left text-body-md">
          <thead>
            <tr className="border-b border-border-strong">
              <th scope="col" className="py-snug pr-grid font-medium text-text-secondary">
                Feature
              </th>
              <th scope="col" className="px-grid py-snug text-center font-medium text-text-primary">
                Starter
              </th>
              <th scope="col" className="px-grid py-snug text-center font-medium text-accent-bristle">
                Pro
              </th>
              <th scope="col" className="py-snug pl-grid text-center font-medium text-text-primary">
                Team
              </th>
            </tr>
          </thead>
          <tbody>
            {COMPARE_ROWS.map((row) => (
              <tr key={row.label} className="border-b border-border-default">
                <th
                  scope="row"
                  className="py-snug pr-grid font-normal text-text-primary"
                >
                  {row.label}
                </th>
                <td className="px-grid py-snug text-center text-text-secondary">
                  {renderCell(row.starter)}
                </td>
                <td className="px-grid py-snug text-center text-text-secondary">
                  {renderCell(row.pro)}
                </td>
                <td className="py-snug pl-grid text-center text-text-secondary">
                  {renderCell(row.team)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
