const {fetchQuery} = require("./server/queryUtils");
const AS_COMPONENTS = ["Activity Streams: Newtab", "New Tab Page", "Activity Streams: Application Servers"];
const fs = require("fs");
const path = require("path");
const chalk = require("chalk");

async function main() {
  // Edit the query here, then run node sandbox.js from your terminal.
  const query = {
    include_fields: ["id", "summary"],
    resolution: "---",
    component: AS_COMPONENTS,
    iteration: "61.3",
    // hasPR: true,
    custom: {
      // "attachments.mimetype": ["github", "review-board-request"]
      "attachments.mimetype": "github"
    }
    // order: "changeddate DESC",
  };
  const results = await fetchQuery(query);
  if (!results || !results.length) {
    console.log("No results were found.");
    return;
  }
  console.log(results);
  const filename = `sandbox_results/${Date.now()}_RESULTS.json`;
  fs.writeFileSync(path.join(__dirname, filename), JSON.stringify({query, results}, null, 2));
  console.log(`${chalk.green(`\nSuccess: ${results.length} bugs found.`)}\nWrote results to ${filename}`);
}

main();
