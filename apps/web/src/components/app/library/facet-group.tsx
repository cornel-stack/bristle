"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

// One facet group's labeled checkboxes + live counts. Toggling a value updates
// its ?param (comma-joined multi-value) so the RSC re-filters. 0-count values
// render gray + disabled (not broken); a checked value stays enabled so it can
// be unchecked even if it now yields 0.
export interface FacetValue {
  value: string;
  label: string;
  count: number;
}

export function FacetGroup({
  param,
  title,
  values,
  selected,
}: {
  param: string;
  title: string;
  values: FacetValue[];
  selected: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedSet = new Set(selected);

  function toggle(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    const cur = new Set((params.get(param) ?? "").split(",").filter(Boolean));
    if (cur.has(value)) cur.delete(value);
    else cur.add(value);
    if (cur.size) params.set(param, [...cur].join(","));
    else params.delete(param);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  return (
    <fieldset className="border-0 p-0">
      <legend className="mb-2 text-body-sm font-medium uppercase tracking-wide text-text-secondary">
        {title}
      </legend>
      <ul className="flex flex-col gap-1.5">
        {values.map((v) => {
          const checked = selectedSet.has(v.value);
          const disabled = v.count === 0 && !checked;
          return (
            <li key={v.value}>
              <label
                className={`flex cursor-pointer items-center gap-2 text-body-sm ${
                  disabled ? "cursor-default text-text-tertiary" : "text-text-primary"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={disabled}
                  onChange={() => toggle(v.value)}
                  className="size-4 shrink-0 accent-accent-bristle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle"
                />
                <span className="min-w-0 flex-1 truncate">{v.label}</span>
                <span className="font-mono text-text-tertiary">{v.count}</span>
              </label>
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}
