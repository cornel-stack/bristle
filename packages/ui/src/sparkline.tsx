// Pure sparkline path generator + presentational SVG. Server component (no hooks,
// no client directive). Color comes from the parent via `currentColor`.

/**
 * Map a numeric series to an SVG path `d` string within a width×height box.
 * Flat / single-value series collapse to a horizontal mid-line (no divide-by-zero).
 * An empty series yields an empty path.
 */
export function buildSparklinePath(values: number[], width: number, height: number): string {
  if (values.length === 0) return "";
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  const stepX = values.length > 1 ? width / (values.length - 1) : 0;
  return values
    .map((v, i) => {
      const x = i * stepX;
      const y = range === 0 ? height / 2 : height - ((v - min) / range) * height;
      return `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

export interface SparklineProps {
  values: number[];
  width?: number;
  height?: number;
  className?: string;
}

export function Sparkline({ values, width = 80, height = 24, className }: SparklineProps) {
  return (
    <svg
      className={className}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={buildSparklinePath(values, width, height)} />
    </svg>
  );
}
