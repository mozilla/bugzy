const {configToQuery, addRuleSet} = require("./queryUtils");
const {assert} = require("chai");

describe("configToQuery", () => {
  it("should generate a good query", () => {
    const expected = {
      include_fields: "id,summary,status,assigned_to,priority",
      component: [
        "Activity Streams: Newtab",
        "New Tab Page",
        "Activity Streams: Application Servers",
      ],
      f1: "cf_fx_iteration",
      o1: "anywordssubstr",
      v1: "60.4",
      f2: "assigned_to",
      o2: "exactly",
      v2: "foo,bar",
    };
    const result = configToQuery({
      include_fields: ["id", "summary", "status", "assigned_to", "priority"],
      component: [
        "Activity Streams: Newtab",
        "New Tab Page",
        "Activity Streams: Application Servers",
      ],
      iteration: ["60.4"],
      custom: {
        assigned_to: {exactly: ["foo", "bar"]},
      },
    });
    assert.deepEqual(result, expected);
  });
});

describe("_addRuleset", () => {
  it("should convert arrays", () => {
    const qs = {};
    const config = [
      {key: "a", operator: "contains", value: 1},
      {key: "b", value: 2},
      [{key: "c", value: 3}],
      {key: "d", value: 4},
    ];
    const result = addRuleSet(config);
    const expected = {
      query_format: "advanced",
      f1: "a",
      o1: "contains",
      v1: 1,
      f2: "b",
      o2: "equals",
      v2: 2,
      f3: "OP",
      f4: "c",
      o4: "equals",
      v4: 3,
      f5: "CP",
      f6: "d",
      o6: "equals",
      v6: 4,
    };
    assert.deepEqual(result, expected);
  });
  it("should convert a top-level operator", () => {
    const qs = {};
    const config = {
      operator: "OR",
      rules: [{key: "a", operator: "contains", value: 1}, {key: "b", value: 2}],
    };
    const result = addRuleSet(config);
    const expected = {
      query_format: "advanced",
      j_top: "OR",
      f1: "a",
      o1: "contains",
      v1: 1,
      f2: "b",
      o2: "equals",
      v2: 2,
    };
    assert.deepEqual(result, expected);
  });
  it("should convert operators in sub-groups", () => {
    const qs = {};
    const config = [
      {key: "a", operator: "contains", value: 1},
      {
        operator: "OR",
        rules: [{key: "b", value: 2}, {key: "c", value: 3}],
      },
    ];
    const result = addRuleSet(config);
    const expected = {
      query_format: "advanced",
      f1: "a",
      o1: "contains",
      v1: 1,
      f2: "OP",
      j2: "OR",
      f3: "b",
      o3: "equals",
      v3: 2,
      f4: "c",
      o4: "equals",
      v4: 3,
      f5: "CP",
    };
    assert.deepEqual(result, expected);
  });
});
