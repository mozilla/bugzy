import * as request from "request";
import { DateTime } from "luxon";

const BZ_BASE_URI = "https://bugzilla.mozilla.org/rest/bug";
const PHAB_TOKEN = process.env.BUGZY_PHAB_API_KEY;

type QueryConfig = {
  rules: QueryConfig | Array<QueryConfig>;
  custom?: Object;
  operator?: string;
  key?: string;
  value?: string;
  iteration?: string;
  include_fields: Array<string>;
};

interface Message {
  bugzillaId: string;
  status: string | React.ReactNode;
}

export interface RSMessage extends Message {
  id: string;
  template: string;
  targeting: string;
  parsedTargetingExpression: any;
  frequency: { lifetime: number };
  content: any;
}

// IN PROGRESS
function _checkGroupOperator(o) {
  if (!["OR", "AND"].includes(o)) {
    throw new Error(
      `${o} is not a valid group operator. Your choices are: OR, AND`
    );
  }
}

const GROUP_OPEN_VALUE = "OP";
const GROUP_CLOSE_VALUE = "CP";

function _addRuleSet(
  config: QueryConfig | Array<QueryConfig>,
  resultQs: any,
  currentIndex: number = 1
) {
  const isTopLevel = currentIndex === 1;

  // Special case for the first group
  if (isTopLevel && !Array.isArray(config) && config.rules && config.operator) {
    _checkGroupOperator(config.operator);
    resultQs.j_top = config.operator;
    return _addRuleSet(config.rules, resultQs, currentIndex);
  }

  // group definition
  let rules: Array<QueryConfig> | void;
  if (Array.isArray(config)) rules = config;
  else if (Array.isArray(config.rules)) rules = config.rules;

  if (rules) {
    // OPENING
    if (!isTopLevel) {
      resultQs[`f${currentIndex}`] = GROUP_OPEN_VALUE;
      if (!Array.isArray(config) && config.operator) {
        _checkGroupOperator(config.operator);
        resultQs[`j${currentIndex}`] = config.operator;
      }
      currentIndex++;
    }

    for (const rule of rules) {
      currentIndex = _addRuleSet(rule, resultQs, currentIndex);
    }

    // ENDING
    if (!isTopLevel) {
      resultQs[`f${currentIndex}`] = GROUP_CLOSE_VALUE;
    }
    return currentIndex + 1;
  }

  // rule definition
  else if (!Array.isArray(config)) {
    resultQs[`f${currentIndex}`] = config.key;
    resultQs[`o${currentIndex}`] = config.operator || "equals";
    resultQs[`v${currentIndex}`] = config.value;
    return currentIndex + 1;
  }
  return currentIndex;
}

export function addRuleSet(config: QueryConfig | Array<QueryConfig>) {
  const result = { query_format: "advanced" };
  _addRuleSet(config, result);
  return result;
}

function _addCustom(key, value, fIndex) {
  let i = fIndex + 1;
  const qs = {};
  if (value instanceof Array) {
    qs[`f${i}`] = key;
    qs[`o${i}`] = "anywordssubstr";
    qs[`v${i}`] = value.join(",");
    i++;
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
  return { result: qs, index: i - 1 };
}

// Converts a configuration to a query string understood by Bugzilla
export function configToQuery(config: QueryConfig) {
  const qs: { include_fields?: any } = {};
  let fIndex = 0;

  function addCustom(key, value) {
    const { result, index } = _addCustom(key, value, fIndex);
    fIndex = index;
    return result;
  }
  if (config.rules && config.custom) {
    throw new Error(
      "You can't use both .custom and .rules; choose one or the other."
    );
  }
  for (const key in config) {
    switch (key) {
      case "include_fields":
        qs.include_fields = config.include_fields.join(",");
        break;
      case "iteration":
        Object.assign(qs, addCustom("cf_fx_iteration", config.iteration));
        break;
      case "custom":
        for (const k in config.custom) {
          Object.assign(qs, addCustom(k, config.custom[k]));
        }
        break;
      case "rules":
        Object.assign(qs, addRuleSet(config.rules));
        break;
      default:
        qs[key] = config[key];
    }
  }

  if (!qs.include_fields) {
    qs.include_fields = "id,summary,status,assigned_to,blocks,priority,";
  }

  return qs;
}

// Fetches bugs from bugzilla given a query string
export async function fetchBugsFromBugzilla(qs: Object): Promise<any> {
  return new Promise((resolve, reject) => {
    try {
      request(
        {
          uri: BZ_BASE_URI,
          method: "GET",
          qs,
          qsStringifyOptions: { arrayFormat: "repeat" },
          headers: process.env.BUGZY_BZ_API_KEY
            ? {
                "X-BUGZILLA-API-KEY": process.env.BUGZY_BZ_API_KEY,
              }
            : {},
        },
        (error, resp, body) => {
          if (error) {
            console.log(error);
            return reject(error);
          }
          let parsed = { bugs: [] };
          try {
            parsed = JSON.parse(body);
          } catch (e) {
            console.log(body, qs);
            console.error(e);
          }
          const uri = resp.request.uri.href;
          resolve({ uri, bugs: parsed.bugs });
        }
      );
    } catch (e) {
      reject(e);
    }
  });
}

export async function fetchRemoteSettingsMessages(
  uri: string
): Promise<RSMessage[]> {
  return new Promise((resolve, reject) => {
    try {
      request(uri, (error, _response, body) => {
        if (error) {
          return reject(error);
        }
        try {
          return resolve(JSON.parse(body).data);
        } catch (e) {
          return reject(e);
        }
      });
    } catch (e) {
      reject(e);
    }
  });
}

export async function fetchBugById(id: String): Promise<Object> {
  return new Promise((resolve, reject) => {
    try {
      request.get(`${BZ_BASE_URI}/${id}`, (error, _response, body) => {
        if (error) {
          return reject(error);
        }
        try {
          return resolve(JSON.parse(body).bugs[0]);
        } catch (e) {
          return reject(e);
        }
      });
    } catch (e) {
      reject(e);
    }
  });
}

export async function fetchStatusFromPhabricator(
  attachmentSets: Array<any>
): Promise<any[]> {
  let ids = [];
  attachmentSets.forEach(set =>
    set.forEach(attachment => {
      if (attachment.file_name?.startsWith("phabricator")) {
        ids.push(attachment.file_name.split("-")[1].substring(1));
      }
    })
  );

  let form = { "api.token": PHAB_TOKEN };
  for (let id in ids) {
    form[`ids[${id}]`] = ids[id];
  }
  return new Promise((resolve, reject) => {
    try {
      request.post(
        {
          url:
            "https://phabricator.services.mozilla.com/api/differential.query",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          form,
        },
        (error: any, resp: any, body: string) => {
          if (error) {
            console.log(error);
            return reject(error);
          }
          let parsed;
          try {
            parsed = JSON.parse(body);
          } catch (e) {
            console.log(body);
            console.error(e);
          }
          resolve(parsed.result);
        }
      );
    } catch (e) {
      reject(e);
    }
  });
}

export async function fetchReviewersFromPhabricatorByPHID(
  reviewers: Array<any>
) {
  if (!(reviewers.length > 0)) return {};

  let conduitReq = {
    "api.token": PHAB_TOKEN,
  };

  for (let phid in reviewers) {
    conduitReq[`phids[${phid}]`] = reviewers[phid];
  }

  let headers = {
    "Content-Type": "application/x-www-form-urlencoded",
  };
  return new Promise((resolve, reject) => {
    try {
      request.post(
        {
          url: "https://phabricator.services.mozilla.com/api/phid.query",
          headers: headers,
          form: conduitReq,
        },
        (error, resp, body) => {
          if (error) {
            console.log(error);
            return reject(error);
          }
          let parsed;
          try {
            parsed = JSON.parse(body);
          } catch (e) {
            console.log(body);
            console.error(e);
          }
          const uri = resp.request.uri.href;
          resolve(parsed.result);
        }
      );
    } catch (e) {
      reject(e);
    }
  });
}

export async function fetchQuery(query: QueryConfig) {
  const qs = configToQuery(query);
  const fetchAttachments = qs.include_fields?.includes("attachments");
  let { uri, bugs } = (await fetchBugsFromBugzilla(qs)) || [];

  if (fetchAttachments) {
    let attachmentSets = bugs.map(bug => bug.attachments);
    if (attachmentSets.filter(a => a).length > 0) {
      let statuses = await fetchStatusFromPhabricator(attachmentSets);
      let tickets = statuses.map(
        ({ statusName, auxiliary, id, reviewers }) => ({
          statusName,
          bugId: auxiliary["bugzilla.bug-id"],
          id,
          reviewers,
        })
      );

      // FIXME: Find a way to do all of this in a single request instead of
      // iterating over each ticket
      for (let ticket of tickets) {
        if (ticket.reviewers) {
          let reviewers = await fetchReviewersFromPhabricatorByPHID(
            Object.values(ticket.reviewers)
          );
          ticket.reviewers = Object.values(reviewers).map(review => [
            review.fullName,
            review.uri,
          ]);
        }
      }

      bugs.forEach(bug => {
        bug.phabStatus = [];
        bug.phabIds = [];
        bug.reviewers = [];
        for (let ticket of tickets) {
          if (ticket.bugId == bug.id) {
            bug.phabStatus.push(ticket.statusName);
            bug.phabIds.push(ticket.id);
            bug.reviewers.push(ticket.reviewers);
          }
        }
      });
    }
  }

  return {
    uri,
    query,
    bugs,
  };
}
