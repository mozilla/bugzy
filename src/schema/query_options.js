// see https://bmo.readthedocs.io/en/latest/api/core/v1/bug.html#get-bug

const definitions = {
  id: {
    displayName: "Bug",
    description: "The bug number",
    type: "integer",
    examples: [1421682],
  },
  summary: {
    displayName: "Title",
    description: "The bug title ",
    type: "string",
    examples: ["Add title to activitystream.html"],
  },
  status: {
    displayName: "Status",
    description: "Whether a bug is new, assigned, resolved, closed, etc.",
    type: {
      oneOf: [
        "UNCONFIRMED",
        "NEW",
        "ASSIGNED",
        "REOPENED",
        "RESOLVED",
        "REOPENED",
        "VERIFIED",
        "CLOSED",
      ],
    },
    examples: ["NEW", "VERIFIED"],
  },
  type: {
    displayName: "Type",
    description: "Whether a bug is a task, enhancement or defect",
    type: { oneOf: ["task", "enhancement", "defect"] },
    example: ["defect"],
  },
  resolution: {
    displayName: "Resolution",
    description: "How was the bug resolved?",
    type: {
      oneOf: [
        "",
        "FIXED",
        "INVALID",
        "WONTFIX",
        "DUPLICATE",
        "WORKSFORME",
        "INCOMPLETE",
        "SUPPORT",
        "EXPIRED",
        "MOVED",
      ],
    },
    examples: ["", "FIXED"],
  },
  priority: {
    displayName: "Priority",
    description: "The priority of the bug",
    type: { oneOf: ["", "P1", "P2", "P3", "P4", "P5"] },
    examples: ["", "P2"],
  },
  whiteboard: {
    displayName: "Whiteboard",
    description: "Freeform tags surrounded by square brackets",
    type: "string",
    examples: ["", "[foo]", "[AS60MVP] [foo]"],
  },
  assigned_to: {
    displayName: "Assignee",
    description:
      "Email of assignee or nobody@mozilla.org if not assigned. Note: a assigned_to_detail field will also be returned",
    type: "string",
    examples: ["foo@bar.com", "nobody@mozilla.org"],
  },
  cf_fx_iteration: {
    displayName: "Iteration",
    description: "The iteration in which the bug should be completed",
    type: "string",
    examples: ["60.2 - Feb 12"],
  },
  component: {
    displayName: "Component",
    description: "The Bugzilla Component",
    type: "string",
    examples: ["Activity Streams: Application Servers"],
  },
  cc: {
    displayName: "CC'd",
    description: "Bugs on which a given email is cc'd",
    type: "email",
    examples: ["foobar@foobar.com"],
  },
  blocked: {
    displayName: "Blocked by",
    description: "Bugs that block a given bug number",
    type: "integer",
    examples: [1421682],
  },
  dependson: {
    displayName: "Depends on",
    description: "Bugs that depend on a given bug number",
    type: "integer",
    examples: [1421682],
  },
  creation_ts: {
    displayName: "Creation date",
    description: "Date bug was filed",
    type: "datestring",
    examples: "2018-03-01",
  },
  "attachments.mimetype": {
    displayName: "Attachment mime type",
    description: "Has an attachment with the specified mime type",
    type: "string",
    examples: ["github", "review-board-request"],
  },
  last_change_time: {
    displayName: "Last Updated",
    description: "When the bug was last updated",
    type: "date",
    examples: ["2018-03-05T17:18:57Z"],
  },
  target_milestone: {
    displayName: "Target milestone",
    description: "The target release",
    type: "number",
    example: [60, 61],
  },
  "flagtypes.name": {
    displayName: "Flags",
    description: "Name of flags set on a bug",
    type: "string",
    example: ["needinfo"],
  },
  "requestees.login_name": {
    displayName: "Flagged",
    description: "Email of someone who has been flagged on a bug",
    type: "string",
    examples: ["foo@boo.com"],
  },
  "setters.login_name": {
    displayName: "Flagged by",
    description: "Email of someone who has requested a flag",
    type: "string",
    examples: ["foo@boo.com"],
  },
  keywords: {
    displayName: "Keywords",
    description: "Array of keywords",
    type: "Array",
    examples: ["uineeded"],
  },
  j_top: {
    displayName: "Custom search AND/OR",
    description: "How should custom searches be combined? Note: default is AND",
    type: { oneOf: ["", "OR", "AND_G"] }, // Note: AND_G means match all of the following against the same field
    examples: ["OR"],
    // NOTE: Additional blocks can be j2=OR, j3=OR
  },

  // THESE ARE SPECIAL created by post processing
  cf_status_nightly: {
    displayName: "Nightly",
    type: "string",
    examples: ["affected", "fixed"],
  },
  cf_status_beta: {
    displayName: "Beta",
    type: "string",
    examples: ["affected", "fixed"],
  },
  cf_tracking_beta: {
    displayName: "Beta:tracking",
    type: "string",
    examples: ["+", "?"],
  },
  cf_last_resolved: {
    displayName: "Resolved on",
    type: "date",
  },
};

const include_fields = [
  "id",
  "summary",
  "keywords",
  "status",
  "resolution",
  "priority",
  "whiteboard",
  "assigned_to",
  "cf_fx_iteration",
  "component",
  "type",
  "last_change_time",
  "cf_last_resolved",
  "depends_on", // maps to dependson
  "blocks", // maps to blocked
  "flags", // used for needinfos
];

// Note: you can match mutiple things like this:
// component=Foo&component=Bar
const builtin_filters = ["component", "status", "resolution", "id", "priority"];

const custom_filters = [
  "cf_fx_iteration",
  "assigned_to",
  "cc",
  "blocked",
  "dependson",
  "whiteboard",
  "creation_ts",
  "type",
  "attachments.mimetype",
  "target_milestone",
  "flagtypes.name",
  "requestees.login_name",
  "setters.login_name",
];

const custom_comparitors = {
  equals: { displayName: "is" },
  notequals: { displayName: "is not" },
  anyexact: { displayName: "is any of" },
  anywordssubstr: { displayName: "contains any of" },
  nowordssubstr: { displayName: "does not contain any of" },
  substring: { displayName: "contains" },
  notsubstring: { displayName: "does not contain" },
  casesubstring: { displayName: "contains (matching case)" },
  lessthan: { displayName: "is less than" },
  lessthaneq: { displayName: "is less than or equal to" },
  greaterthan: { displayName: "is greater than" },
  greaterthaneq: { displayName: "is greater than or equal to" },
};

// Note: these values should be added under the key "order".
// in order change the sort direction to descending, append " DESC"
// to the end of id. To sort by multiple, add a comma in between.
const sort_keys = [
  "changeddate",
  "bug_id",
  "priority",
  "assigned_to",
  "bug_status",
  "Resolution",
  "cf_last_resolved",
];

module.exports = {
  definitions,
  include_fields,
  builtin_filters,
  custom_filters,
  custom_comparitors,
  sort_keys,
};
