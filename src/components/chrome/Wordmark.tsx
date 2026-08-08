/**
 * The INK & GEARS mark: two stacked lines of heavy, angular, back-slanted
 * caps. Drawn as text inside an SVG so it scales, stays selectable-free, and
 * never needs a font file at runtime beyond the display face.
 */
export function Wordmark({
  className = "",
  height = 34,
}: {
  className?: string;
  height?: number;
}) {
  const w = (height / 34) * 118;
  return (
    <svg
      viewBox="0 0 118 34"
      width={w}
      height={height}
      className={className}
      role="img"
      aria-label="INK &amp; GEARS"
    >
      <g
        fill="currentColor"
        fontFamily="var(--font-display-stack)"
        fontWeight="800"
        textAnchor="middle"
        transform="skewX(-8)"
      >
        <text x="63" y="15" fontSize="17" letterSpacing="-0.5">
          INK &amp;
        </text>
        <text x="61" y="31" fontSize="17" letterSpacing="-0.5">
          GEARS
        </text>
      </g>
    </svg>
  );
}
