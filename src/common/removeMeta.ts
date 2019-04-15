/** Removes the [meta]/[META] label from a bug title  */

const META_REGEX = /^\[\s*meta\s*\]\s*/i;
const FX_VERSION_REGEX = /\s(in\s|-\s)*(firefox|fx)\s*\d+/i;

export function removeMeta(summary: string): string {
  return summary.replace(META_REGEX, "").replace(FX_VERSION_REGEX, "");
}
