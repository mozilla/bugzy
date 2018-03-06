const definitions = {
  id: {
    displayName: "Bug",
    description: "The bug number",
    type: "integer",
    examples: [1421682]
  },
  summary: {
    displayName: "Title",
    description: "The bug title ",
    type: "string",
    examples: ["Add title to activitystream.html"]
  },
  status: {
    displayName: "Status",
    description: "Whether a bug is new, assigned, resolved, closed, etc.",
    type: {oneOf: ["UNCONFIRMED", "NEW", "ASSIGNED", "REOPENED", "RESOLVED", "REOPENED", "VERIFIED", "CLOSED"]},
    examples: ["NEW", "VERIFIED"]
  },
  resolution: {
    displayName: "Resolution",
    description: "How was the bug resolved?",
    type: {oneOf: ["", "FIXED", "INVALID", "WONTFIX", "DUPLICATE", "WORKSFORME", "INCOMPLETE", "SUPPORT", "EXPIRED", "MOVED"]},
    examples: ["", "FIXED"]
  },
  priority: {
    displayName: "Priority",
    description: "The priority of the bug",
    type: {oneOf: ["", "P1", "P2", "P3", "P4", "P5"]},
    examples: ["", "P2"]
  },
  whiteboard: {
    displayName: "Whiteboard",
    description: "Freeform tags surrounded by square brackets",
    type: "string",
    examples: ["", "[foo]", "[AS60MVP] [foo]"]
  },
  assigned_to: {
    displayName: "Assignee",
    description: "Email of assignee or nobody@mozilla.org if not assigned. Note: a assigned_to_detail field will also be returned",
    type: "string",
    examples: ["foo@bar.com", "nobody@mozilla.org"]
  },
  cf_fx_iteration: {
    displayName: "Iteration",
    description: "The iteration in which the bug should be completed",
    type: "string",
    examples: ["60.2 - Feb 12"]
  },
  component: {
    displayName: "Component",
    description: "The Bugzilla Component",
    type: "string",
    examples: ["Activity Streams: Application Servers"]
  },
  cc: {
    displayName: "CC'd",
    description: "Bugs on which a given email is cc'd",
    type: "email",
    examples: ["foobar@foobar.com"]
  },
  blocked: {
    displayName: "Blocked by",
    description: "Bugs that are blocked by a given bug number",
    type: "integer",
    examples: [1421682]
  },
  dependson: {
    displayName: "Depends on",
    description: "Bugs that depend on a given bug number",
    type: "integer",
    examples: [1421682]
  },
  creation_ts: {
    displayName: "Creation date",
    description: "Date bug was filed",
    type: "datestring",
    examples: "2018-03-01"
  },
  severity: {
    displayName: "Severity",
    description: "Severity of bug",
    type: {oneOf: ["normal", "enhancement"]}
  }
};

const include_fields = [
  "id",
  "summary",
  "status",
  "resolution",
  "priority",
  "whiteboard",
  "assigned_to",
  "cf_fx_iteration",
  "component",
  "severity"
];

// Note: you can match mutiple things like this:
// component=Foo&component=Bar
const builtin_filters = [
  "component",
  "status",
  "resolution"
];

const custom_filters = [
  "cf_fx_iteration",
  "assigned_to",
  "cc",
  "blocked",
  "dependson",
  "whiteboard",
  "creation_ts",
  "severity"
];

const custom_comparitors = {
  "equals": {
    displayName: "is"
  },
  "notequals": {
    displayName: "is not"
  },
  "anyexact": {
    displayName: "is any of"
  },
  "anywordssubstr": {
    displayName: "contains any of"
  },
  "substring": {
    displayName: "contains"
  },
  "casesubstring": {
    displayName: "contains (matching case)"
  },
  "lessthan": {
    displayName: "is less than"
  },
  "lessthaneq": {
    displayName: "is less than or equal to"
  },
  "greaterthan": {
    displayName: "is greater than"
  },
  "greaterthaneq": {
    displayName: "is greater than or equal to"
  }
};

module.exports = {
  definitions,
  include_fields,
  builtin_filters,
  custom_filers,
  custom_comparitors,
};
