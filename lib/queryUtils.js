const request = require("request");
const {queries} = require("../config/queries");

const BZ_BASE_URI = "https://bugzilla.mozilla.org/rest/bug";

function _addCustom(key, value, fIndex) {
  const i = fIndex + 1;
  const qs = {};
  qs[`f${i}`] = key;
  if (value instanceof Array) {
    qs[`o${i}`] = "anywordssubstr";
    qs[`v${i}`] = value.join(",");
  } else if (value.exactly && value.exactly instanceof Array) {
    qs[`o${i}`] = "anyexact";
    qs[`v${i}`] = value.exactly.join(",");
  } else if (value.exactly) {
    qs[`o${i}`] = "equal";
    qs[`v${i}`] = value.exactly;
  } else {
    qs[`o${i}`] = "substring";
    qs[`v${i}`] = value;
  }
  return qs;
}

// Converts a configuration to a query string understood by Bugzilla
function configToQuery(config) {
  const qs = {};
  let fIndex = 0;

  function addCustom(key, value) {
    const result = _addCustom(key, value, fIndex);
    fIndex++;
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
      case "custom":
        for (const k in config.custom) {
          Object.assign(qs, addCustom(k, config.custom[k]))
        }
        break;
      default:
        qs[key] = config[key];
    }
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
        qs
      }, (error, resp, body) => {
        if (error) return reject(error);
        resolve(JSON.parse(body).bugs);
      });
    } catch (e) {
      reject(e);
    }
  });
}

const cache = {};

async function runQuery(options) {
  const queryId = options.id;

  if (!queries[queryId]) {
    throw new Error(`Could not find a query in config/queries.js with id ${queryId}`);
  }

  const config = queries[queryId]();
  const qs = configToQuery(config.query);

  if (!cache[queryId] || options.force) {
    cache[queryId] = await fetchBugsFromBugzilla(qs);
  }

  return Object.assign({}, config, {
    qs,
    bugs: cache[queryId]
  });

  return response;
}


module.exports = {
  configToQuery,
  runQuery
};
