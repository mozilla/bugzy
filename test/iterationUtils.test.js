const {DateTime} = require("luxon");
const {getIteration} = require("../lib/iterationUtils");
const {assert} = require("chai");

describe("getIteration", () => {
  it("should return the right iteration for the reference iteration", () => {
    const result = getIteration("2018-01-28");
    assert.equal(result.number, "60.1");
    assert.include(result.start, "2018-01-15");
    assert.include(result.due, "2018-01-29");
  });
  it("should return the right iteration for a mid-week day", () => {
    const result = getIteration("2018-03-01");
    assert.equal(result.number, "60.4");
    assert.include(result.start, "2018-02-26");
    assert.include(result.due, "2018-03-12");
  });
  it("should return the right iteration for the first monday", () => {
    const result = getIteration("2018-03-12");
    assert.equal(result.number, "61.1");
    assert.include(result.start, "2018-03-12");
    assert.include(result.due, "2018-03-26");
  });
});
