import { asset } from "@/lib/asset";

/**
 * The INK & GEARS mark.
 *
 * Lives in `public/logo.svg` so swapping in the master artwork is a one-file
 * change — drop your own file over it (svg or png, adjust the extension here)
 * and nothing else moves.
 */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={asset("/logo.svg")}
      alt="INK &amp; GEARS"
      className={`w-auto select-none ${className}`}
      draggable={false}
    />
  );
}
