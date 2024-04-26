import * as request from "request";
import { IterationLookup, lookupIterations } from "../common/IterationLookup";

const BZ_BASE_URI = "https://bugzilla.mozilla.org/rest";
const BZ_BUG_URI = `${BZ_BASE_URI}/bug`;
// Details about all fields
const BZ_FIELDS_URI = `${BZ_BASE_URI}/field/bug`;
// Details about Iterations field
export const ITERATION_FIELD_NAME = "cf_fx_iteration";
const BZ_ITERATIONS_URI = `${BZ_FIELDS_URI}/${ITERATION_FIELD_NAME}`;
const FX_VERSIONS_URI =
  "https://product-details.mozilla.org/1.0/firefox_versions.json";
const BUILDHUB_URI = "https://buildhub.moz.tools/api/search";

interface QueryProperties {
  custom?: Object;
  operator?: string;
  key?: string;
  value?: string;
  iteration?: string;
  rules?: QueryProperties | Array<QueryProperties>;
  include_fields?: Array<string>;
  chfield?: string;
  chfieldfrom?: string;
  chfieldto?: string;
  keywords?: string;
  keywords_type?: string;
  resolution?: string;
}

interface QueryConfig extends QueryProperties {
  rules: QueryProperties | Array<QueryProperties>;
  include_fields: Array<string>;
}

type QueryRuleSet =
  | QueryConfig
  | Array<QueryConfig>
  | QueryProperties
  | Array<QueryProperties>;

interface Message {
  bugzillaId: string;
  status: string;
}

export interface RSMessage extends Message {
  id: string;
  template: string;
  targeting: string;
  parsedTargetingExpression: any;
  frequency: { lifetime: number };
  content: any;
}

interface Field {
  id: number;
  type:
    | 0 // Field type unknown
    | 1 // Single-line string field
    | 2 // Single value field
    | 3 // Multiple value field
    | 4 // Multi-line text value
    | 5 // Date field with time
    | 6 // Bug ID field
    | 7 // See Also field
    | 8 // Keywords field
    | 9 // Date field
    | 10; // Integer field
  is_custom: boolean;
  name: string;
  display_name: string;
  is_mandatory: boolean;
  is_on_bug_entry: boolean;
  visibility_field: string | null;
  visibility_values: string[];
  value_field: string | null;
  values: Array<FieldValue | KeywordValue | BugStatusValue>;
}

interface FieldValue {
  name: string;
  sort_key: number | void;
  sortkey?: number | void;
  visibility_values?: string[];
  is_active?: boolean;
}

interface KeywordValue extends FieldValue {
  description: string;
}

interface BugStatusValue extends FieldValue {
  is_open: boolean;
  can_change_to: { name: string; comment_required: boolean }[];
}

type FieldsResponse = { fields: Field[] };

interface ChannelData {
  version: string; // 115 (not 115.0a1)
  statusFlag: string; // cf_status_firefox115
  date?: string; // YYYY-MM-DD
}

interface ReleaseData {
  nightly: ChannelData;
  beta: ChannelData;
  release: ChannelData;
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
  config: QueryRuleSet,
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
  let rules: Array<QueryConfig> | Array<QueryProperties> | void;
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

export function addRuleSet(config: QueryRuleSet) {
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
        Object.assign(qs, addCustom(ITERATION_FIELD_NAME, config.iteration));
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
    qs.include_fields = [
      "id",
      "summary",
      "status",
      "assigned_to",
      "blocks",
      "priority",
      "",
    ];
  }

  return qs;
}

export async function fetchTriageOwnerEmail({
  product,
  component,
}): Promise<string> {
  if (!product || !component) {
    throw new Error("Product and component are required");
  }
  const uri = `${BZ_BASE_URI}/component?product=${product}&component=${component}`;
  const response = await fetch(uri, {
    method: "GET",
    headers: process.env.BUGZY_BZ_API_KEY
      ? { "X-BUGZILLA-API-KEY": process.env.BUGZY_BZ_API_KEY }
      : {},
  });
  let parsed: { triage_owner: string; [key: string]: any } = {
    triage_owner: "",
  };
  try {
    parsed = await response.json();
    if (parsed.error) {
      throw new Error(
        parsed.message
          ? parsed.documentation
            ? `${parsed.message}\n(see ${parsed.documentation})`
            : parsed.message
          : "Unknown error"
      );
    }
  } catch (e) {
    console.log(parsed, uri);
    console.error(e);
  }
  return parsed?.triage_owner;
}

export async function fetchUsers(emails: string[]): Promise<any> {
  const qs = emails.map(e => `names=${e}`).join("&");
  return new Promise((resolve, reject) => {
    try {
      request(
        {
          uri: `${BZ_BASE_URI}/user?${qs}`,
          method: "GET",
          qsStringifyOptions: { arrayFormat: "repeat" },
          headers: process.env.BUGZY_BZ_API_KEY
            ? { "X-BUGZILLA-API-KEY": process.env.BUGZY_BZ_API_KEY }
            : {},
        },
        (error, resp, body) => {
          if (error) {
            console.log(error);
            reject(error);
            return;
          }
          let parsed = { users: [] };
          try {
            parsed = JSON.parse(body);
          } catch (e) {
            console.log(body, qs);
            console.error(e);
          }
          parsed.users.forEach(u => {
            for (let key of [
              "groups",
              "saved_searches",
              "saved_reports",
              "ldap_email",
              "requests",
            ]) {
              delete u[key];
            }
          });
          const uri = resp.request.uri.href;
          resolve({ uri, users: parsed.users });
        }
      );
    } catch (e) {
      reject(e);
    }
  });
}

// Fetches bugs from bugzilla given a query string
export async function fetchBugsFromBugzilla(qs: Object): Promise<any> {
  return new Promise((resolve, reject) => {
    try {
      request(
        {
          uri: BZ_BUG_URI,
          method: "GET",
          qs,
          qsStringifyOptions: { arrayFormat: "repeat" },
          headers: process.env.BUGZY_BZ_API_KEY
            ? { "X-BUGZILLA-API-KEY": process.env.BUGZY_BZ_API_KEY }
            : {},
        },
        (error, resp, body) => {
          if (error) {
            console.log(error);
            reject(error);
            return;
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

export async function fetchIterations(): Promise<IterationLookup> {
  return new Promise((resolve, reject) => {
    try {
      request(
        {
          uri: BZ_ITERATIONS_URI,
          method: "GET",
          headers: process.env.BUGZY_BZ_API_KEY
            ? { "X-BUGZILLA-API-KEY": process.env.BUGZY_BZ_API_KEY }
            : {},
        },
        (error, resp, body) => {
          if (error) {
            console.log(error);
            reject(error);
            return;
          }
          let parsed: FieldsResponse;
          try {
            parsed = JSON.parse(body);
          } catch (e) {
            console.log(body);
            console.error(e);
            reject(e);
            return;
          }
          resolve(
            lookupIterations(
              parsed.fields
                .find(f => f.name === ITERATION_FIELD_NAME)
                ?.values.map(v => v.name)
            )
          );
        }
      );
    } catch (e) {
      reject(e);
    }
  });
}

export async function fetchBugById(id: String): Promise<Object> {
  return new Promise((resolve, reject) => {
    try {
      request.get(`${BZ_BUG_URI}/${id}`, (error, _response, body) => {
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

export async function fetchQuery(query: QueryConfig) {
  const qs = configToQuery(query);
  const { uri, bugs } = (await fetchBugsFromBugzilla(qs)) || [];
  return {
    uri,
    query,
    bugs,
  };
}

function promiseRequest(options: any): Promise<any> {
  return new Promise((resolve, reject) => {
    request(options, (error, resp, body) => {
      if (error) {
        return reject(error);
      }
      return resolve(JSON.parse(body));
    });
  });
}

export async function fetchReleaseData(): Promise<ReleaseData> {
  let response = await promiseRequest({
    uri: `${FX_VERSIONS_URI}?${Date.now()}`,
    method: "GET",
  });

  const rv: ReleaseData = {
    nightly: { version: response.FIREFOX_NIGHTLY.split(".")[0] },
    beta: { version: response.FIREFOX_DEVEDITION.split(".")[0] },
    release: { version: response.LATEST_FIREFOX_VERSION.split(".")[0] },
  } as any;
  rv.nightly.statusFlag = `cf_status_firefox${rv.nightly.version}`;
  rv.beta.statusFlag = `cf_status_firefox${rv.beta.version}`;
  rv.release.statusFlag = `cf_status_firefox${rv.release.version}`;

  for (const key of ["beta", "release"]) {
    try {
      response = await promiseRequest({
        uri: BUILDHUB_URI,
        method: "POST",
        body: JSON.stringify({
          post_filter: {
            bool: {
              must: [
                { term: { "target.version": `${rv[key].version}.0a1` } },
                { term: { "target.channel": "nightly" } },
                { term: { "source.product": "firefox" } },
              ],
            },
          },
          size: 1,
          sort: [{ "download.date": "asc" }],
        }),
      });
      if (response.hits.hits.length !== 1) {
        throw new Error(
          `Failed to determine build date for v${rv[key].version}`
        );
      }
    } catch (error) {
      console.log(error);
      return rv;
    }
    rv[key].date = response.hits.hits[0]._source.download.date.slice(0, 10);
  }

  return rv;
}
