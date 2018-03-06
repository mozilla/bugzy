const {fetchQuery} = require("./lib/queryUtils");
const AS_COMPONENTS = ["Activity Streams: Newtab", "New Tab Page", "Activity Streams: Application Servers"];

async function main() {
  const results = await fetchQuery({
    component: AS_COMPONENTS,
    include_fields: ["id", "summary", "severity"],
    custom: {
      creation_ts: {
        greaterthaneq: "2018-01-01",
        lessthaneq: "2018-01-05"
      }
    }
  });
  console.log(results);
}

main();
