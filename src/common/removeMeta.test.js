const { removeMeta } = require("./removeMeta");
const { assert } = require("chai");

describe("removeMEta", () => {
  it("should remove [META] from a bug title", () => {
    assert.equal(removeMeta("[META] Foo"), "Foo");
  });
  it("should remove [meta] from a bug title", () => {
    assert.equal(removeMeta("[meta] Foo"), "Foo");
  });
  it("should remove [meta] with no spaces from a bug title", () => {
    assert.equal(removeMeta("[meta]Foo"), "Foo");
  });
});
