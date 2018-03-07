const {fetchQuery} = require("./lib/queryUtils");
const AS_COMPONENTS = ["Activity Streams: Newtab", "New Tab Page", "Activity Streams: Application Servers"];
const fs = require("fs");
const path = require("path");
const chalk = require("chalk");

async function main() {
  const query = {
    component: AS_COMPONENTS,
    include_fields: ["id", "summary"],
    iteration: 60.4,
    custom: {
      blocked: 1432662
    }
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
