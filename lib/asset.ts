/** Prefix files from /public with the base path (needed on GitHub Pages, e.g. /repo-name/video/hero.mp4). */
export function asset(path?: string): string | undefined {
  if (!path) return undefined;
  if (/^https?:\/\//.test(path)) return path;
  const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
