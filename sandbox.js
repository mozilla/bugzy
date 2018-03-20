const {fetchQuery} = require("./lib/queryUtils");
const AS_COMPONENTS = ["Activity Streams: Newtab", "New Tab Page", "Activity Streams: Application Servers"];
const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
const metas = require("./config/metas");

async function main() {
  // Edit the query here, then run node sandbox.js from your terminal.
  const query = {
    include_fields: ["id", "summary"],
    resolution: "---",
    component: AS_COMPONENTS,
    iteration: "61.1",
    hasPR: true
    // custom: {
    //   "attachments.mimetype": ["github", "review-board-request"]
    // }
    // order: "changeddate DESC",
  };
  const results = await fetchQuery(query);
  if (!results || !results.length) {
    console.log("No results were found.");
    return;
  }
  console.log(results);
  const filename = `sandbox_results/${Date.now()}_RESULTS.json`;
  fs.writeFileSync(path.join(__dirname, filename), JSON.stringify({query,results}, null, 2));
  console.log(chalk.green(`\nSuccess: ${results.length} bugs found.`) + `\nWrote results to ${filename}`);
}

main();
