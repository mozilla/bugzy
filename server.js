const {runQuery} = require("./lib/queryUtils");

async function main() {
  const results = await runQuery({id: "current_iteration"});
  console.log(results);
}

main();
