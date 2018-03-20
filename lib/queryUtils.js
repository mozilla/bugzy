const request = require("request");

const BZ_BASE_URI = "https://bugzilla.mozilla.org/rest/bug";

function _addCustom(key, value, fIndex) {
  let i = fIndex + 1;
  const qs = {};
  if (value instanceof Array) {
    qs[`f${i}`] = key;
    qs[`o${i}`] = "anywordssubstr";
    qs[`v${i}`] = value.join(",");
    i++
  } else if (typeof value === "object") {
    for (const operation in value) {
      qs[`f${i}`] = key;
      qs[`o${i}`] = operation;
      if (value[operation] instanceof Array) {
        qs[`v${i}`] = value[operation].join(",");
      } else {
        qs[`v${i}`] = value[operation];
      }
      i++;
    }
  } else {
    qs[`f${i}`] = key;
    qs[`o${i}`] = "substring";
    qs[`v${i}`] = value;
    i++;
  }
  return {result: qs, index: i - 1};
}

// Converts a configuration to a query string understood by Bugzilla
function configToQuery(config) {
  const qs = {};
  let fIndex = 0;

  function addCustom(key, value) {
    const {result, index} = _addCustom(key, value, fIndex);
    fIndex = index;
    return result;
  }
  for (const key in config) {
    switch (key) {
      case "include_fields":
        qs.include_fields = config.include_fields.join(",");
        break;
      case "iteration":
        Object.assign(qs, addCustom("cf_fx_iteration", config.iteration))
        break;
      // This is handled elsewhere
      case "hasPR":
        break;
      case "custom":
        for (const k in config.custom) {
          Object.assign(qs, addCustom(k, config.custom[k]))
        }
        break;
      default:
        qs[key] = config[key];
    }
  }

  if (!qs.include_fields) {
    qs.include_fields = ["id","summary", "status", "assigned_to", "blocks", "priority", ""];
  }

  return qs;
}

// Fetches bugs from bugzilla given a query string
function fetchBugsFromBugzilla(qs) {
  return new Promise((resolve, reject) => {
    try {
      request({
        uri: BZ_BASE_URI,
        method: "GET",
        qs,
        qsStringifyOptions: {arrayFormat: "repeat"}
      }, (error, resp, body) => {
        if (error) {
          console.log(error);
          return reject(error);
        }
        resolve(JSON.parse(body).bugs);
      });
    } catch (e) {
      reject(e);
    }
  });
}

async function fetchQuery(query) {
  const qs = configToQuery(query);
  if (query.hasPR) {
    const prQs = Object.assign({}, query);
    prQs.include_fields = ["id"];
    prQs.custom = Object.assign({}, prQs.custom || {}, {
      "attachments.mimetype": ["github", "review-board-request"]
    });
    console.log(configToQuery(prQs));
    const bugsWithPR = (await fetchBugsFromBugzilla(configToQuery(prQs)))
      .map(bug => bug.id);
    const totalBugs = await fetchBugsFromBugzilla(qs);
    return totalBugs.map(bug => Object.assign({}, bug, {hasPR: bugsWithPR.includes(bug.id)}));
  }
  return await fetchBugsFromBugzilla(qs);
}

module.exports = {
  configToQuery,
  fetchQuery,
  fetchBugsFromBugzilla
};
