const { DateTime } = require("luxon");
const {
  getIteration,
  getAdjacentIteration,
  getWorkDays,
} = require("./iterationUtils");
const { assert } = require("chai");

describe("getIteration", () => {
  it("should return the right iteration for the reference iteration", () => {
    const result = getIteration("2018-01-28");
    assert.equal(result.number, "60.1");
    assert.include(result.start, "2018-01-15");
    assert.include(result.due, "2018-01-28");
  });
  it("should return the right iteration for a mid-week day", () => {
    const result = getIteration("2018-03-01");
    assert.equal(result.number, "60.4");
    assert.include(result.start, "2018-02-26");
    assert.include(result.due, "2018-03-11");
  });
  it("should return the right iteration for the first monday", () => {
    const result = getIteration("2018-03-12");
    assert.equal(result.number, "61.1");
    assert.include(result.start, "2018-03-12");
    assert.include(result.due, "2018-03-25");
  });
  it("should return the right iteration for a 63 iteration", () => {
    const result = getIteration("2018-06-25");
    assert.equal(result.number, "63.1");
    assert.include(result.start, "2018-06-25");
    assert.include(result.due, "2018-07-08");
  });
  it("should return the right iteration for 63.5", () => {
    const result = getIteration("2018-08-20");
    assert.equal(result.number, "63.5");
    assert.include(result.start, "2018-08-20");
  });
  it("should return the right iteration for 64.1", () => {
    const result = getIteration("2018-09-04");
    assert.equal(result.number, "64.1");
    assert.include(result.start, "2018-09-03");
  });
  it("should return the right iteration for 65.4", () => {
    const result = getIteration("2018-12-09");
    assert.equal(result.number, "65.4");
    assert.include(result.start, "2018-12-03");
  });
  it("should return the right iteration for 66.1", () => {
    const result = getIteration("2018-12-11");
    assert.equal(result.number, "66.1");
    assert.include(result.start, "2018-12-10");
  });
  it("should return the right iteration for 72.1", () => {
    const result = getIteration("2019-10-21");
    assert.equal(result.number, "72.1");
    assert.include(result.start, "2019-10-21");
  });
  it("should return the right iteration for the end of 72.3", () => {
    const result = getIteration("2019-12-01");
    assert.equal(result.number, "72.3");
  });
  it("should return the right iteration for 73.1", () => {
    const result = getIteration("2019-12-02");
    assert.equal(result.number, "73.1");
    assert.include(result.start, "2019-12-02");
  });
  it("should return the right iteration for 74.1", () => {
    const result = getIteration("2020-01-06");
    assert.equal(result.number, "74.1");
    assert.include(result.start, "2020-01-06");
  });
  it("should return the right iteration for 75.1", () => {
    const result = getIteration("2020-02-10");
    assert.equal(result.number, "75.1");
    assert.include(result.start, "2020-02-10");
  });
  it("should return the right iteration for 76.1", () => {
    const result = getIteration("2020-03-09");
    assert.equal(result.number, "76.1");
    assert.include(result.start, "2020-03-09");
  });
});

describe("getAdjacentIteration", () => {
  it("should get future iterations correctly", () => {
    const result = getAdjacentIteration(1, "2018-04-20");
    assert.equal(result.number, "61.4");
  });
  it("should get future iterations with a new major version correctly", () => {
    const result = getAdjacentIteration(4, "2018-04-20");
    assert.equal(result.number, "62.3");
  });
  it("should get past iterations correctly", () => {
    const result = getAdjacentIteration(-3, "2018-04-20");
    assert.equal(result.number, "60.4");
  });
});

describe("getWorkDays", () => {
  it("should return the right work days", () => {
    assert.equal(getWorkDays("2018-04-01", "2018-04-12"), 9);
    assert.equal(getWorkDays("2018-03-09", "2018-03-15"), 5);
  });
  it("should return 0 if the start date is the same as the end date", () => {
    assert.equal(getWorkDays("2018-04-01", "2018-04-01"), 0);
  });
});
