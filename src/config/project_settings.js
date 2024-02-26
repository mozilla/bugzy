// The bugzilla product bugs are found in
export const BUGZILLA_PRODUCT = "Firefox";
// What components should we check to do triage?
export const BUGZILLA_TRIAGE_COMPONENTS = [
  "New Tab Page",
  "Pocket",
  "Messaging System",
  "Nimbus Desktop Client",
];
// Components to check when assigned to general triage
export const BUGZILLA_GENERAL_TRIAGE_COMPONENTS = [
  { product: "Firefox", component: "General" },
  { product: "Toolkit", component: "General" },
];
// What is the bug number of the epic containing all meta bugs as blockers?
export const EPIC_BUG_NUMBER = "1534999";
// Old epic bug blocking <2019 projects/features
export const LEGACY_EPIC_BUG_NUMBER = "1433315";
// Component to file new feature metabugs under (see All Features page)
export const FILE_NEW_BUGZILLA_COMPONENT = "Messaging System";
// Metabug for triaging pocket bugs
export const POCKET_META = 1535711;
// Used for some descriptions / titles
export const PROJECT_NAME = "Activity Stream";
// Document describing release information
export const RELEASE_DOC_LINK =
  "https://docs.google.com/spreadsheets/d/1OTNN20IhUm_sPq6awL6cqFTShi4kqCGn6IRvQBL-bcQ";
