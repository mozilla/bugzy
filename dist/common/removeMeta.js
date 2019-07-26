"use strict";
/** Removes the [meta]/[META] label from a bug title  */
Object.defineProperty(exports, "__esModule", { value: true });
const META_REGEX = /^\[\s*meta\s*\]\s*/i;
const FX_VERSION_REGEX = /\s(in\s|-\s)*(firefox|fx)\s*\d+/i;
function removeMeta(summary) {
    return summary.replace(META_REGEX, "").replace(FX_VERSION_REGEX, "");
}
exports.removeMeta = removeMeta;
