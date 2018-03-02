const {configToQuery} = require("../lib/queryUtils");
const {assert} = require("chai");

describe("configToQuery", () => {
  it("should generate a good query", () => {
    const expected = {
      include_fields: 'id,summary,status,assigned_to,priority',
      component: [
        'Activity Streams: Newtab',
        'New Tab Page',
        'Activity Streams: Application Servers'
      ],
      f1: 'cf_fx_iteration',
      o1: 'anywordssubstr',
      v1: '60.4',
      f2: 'assigned_to',
      o2: 'anyexact',
      v2: 'foo,bar'
    };
    const result = configToQuery({
      include_fields: ["id","summary", "status", "assigned_to", "priority"],
      component: ["Activity Streams: Newtab", "New Tab Page", "Activity Streams: Application Servers"],
      iteration: ["60.4"],
      custom: {
        assigned_to: {exactly: ["foo", "bar"]}
      }
    });
    assert.deepEqual(result, expected);
  });
});
