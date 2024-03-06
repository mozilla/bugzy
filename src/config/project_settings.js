// The bugzilla product bugs are found in
export const BUGZILLA_PRODUCT = "Firefox";
// What components should we check to do triage?
export const BUGZILLA_TRIAGE_COMPONENTS = ["Messaging System"];
// Components to check when assigned to general triage
export const BUGZILLA_GENERAL_TRIAGE_COMPONENTS = [
  { product: "Firefox", component: "General" },
  { product: "Toolkit", component: "General" },
];
// What is the bug number of the epic containing all meta bugs as blockers?
export const EPIC_BUG_NUMBER = "1534999";
// Component to file new feature metabugs under (see All Features page)
export const FILE_NEW_BUGZILLA_COMPONENT = "Messaging System";
// Document describing release information
export const RELEASE_DOC_LINK =
  "https://docs.google.com/spreadsheets/d/1OTNN20IhUm_sPq6awL6cqFTShi4kqCGn6IRvQBL-bcQ";
