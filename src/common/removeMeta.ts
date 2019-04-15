/** Removes the [meta]/[META] label from a bug title  */

const META_REGEX = /^\[\s*meta\s*\]\s*/i;

export function removeMeta(summary: string): string {
  return summary.replace(META_REGEX, "");
}
