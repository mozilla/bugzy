module.exports = {
  // The bugzilla product bugs are found in
  BUGZILLA_PRODUCT: "Firefox",
  // What components should we check to do triage?
  BUGZILLA_TRIAGE_COMPONENTS: [
    "New Tab Page",
    "Pocket",
    "Messaging System",
    "Nimbus Desktop Client",
  ],
  // What is the bug number of the epic containing all meta bugs as blockers?
  EPIC_BUG_NUMBER: "1534999",
  // Old epic bug blocking <2019 projects/features
  LEGACY_EPIC_BUG_NUMBER: "1433315",
  // What component should new bugs be filed in?
  // FILE_NEW_BUGZILLA_COMPONENT: "Activity Streams: Newtab",
  // Metabug for triaging pockt bugs
  POCKET_META: 1535711,
  // Used for some descriptions / titles
  PROJECT_NAME: "Activity Stream",
  // Document describing release information
  RELEASE_DOC_LINK:
    "https://docs.google.com/spreadsheets/d/1OTNN20IhUm_sPq6awL6cqFTShi4kqCGn6IRvQBL-bcQ",
  // Bugzilla API endpoint
  // For testing that requires manipulation of Bugzilla data such as creating or updating bugs, switch to the staging API endpoint
  // You will need to update your API key in your environment to be one from the staging instance
  ROOT_URL: "https://bugzilla-dev.allizom.org",
  //ROOT_URL: "https://bugzilla.mozilla.org",
};
