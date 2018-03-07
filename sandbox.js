const {fetchQuery} = require("./lib/queryUtils");
const AS_COMPONENTS = ["Activity Streams: Newtab", "New Tab Page", "Activity Streams: Application Servers"];

async function main() {
  const results = await fetchQuery({
    component: AS_COMPONENTS,
    include_fields: ["id", "summary", "severity"],
    iteration: 60.4,
    custom: {
      blocked: 1432662
    }
  });
  console.log(results);
}

main();
