/**
 * Prefixes a public asset with the deployment's base path.
 *
 * The GitHub Pages build serves from a repo subpath, and a bare `/logo.svg`
 * would 404 there. Next rewrites `next/link` hrefs for you but not raw asset
 * URLs, so those go through here.
 */
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function asset(path: string) {
  return `${BASE}${path}`;
}
