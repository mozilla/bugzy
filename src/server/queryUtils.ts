import * as request from "request";
import { DateTime } from "luxon";

const BZ_BASE_URI = "https://bugzilla.mozilla.org/rest";
const BZ_BUG_URI = `${BZ_BASE_URI}/bug`;
// Details about all fields
const BZ_FIELDS_URI = `${BZ_BASE_URI}/field/bug`;
// Details about Iterations field
export const ITERATION_FIELD_NAME = "cf_fx_iteration";
const BZ_ITERATIONS_URI = `${BZ_FIELDS_URI}/${ITERATION_FIELD_NAME}`;

interface QueryProperties {
  custom?: Object;
  operator?: string;
  key?: string;
  value?: string;
  iteration?: string;
  rules?: QueryProperties | Array<QueryProperties>;
  include_fields?: Array<string>;
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

// Some month strings from Bugzilla iterations are full month strings or
// 4-letter abbreviations like "Sept", so we need to convert them to 3-letter
// abbreviations that luxon can parse, e.g. "Sep".
function normalizeMonthString(month: string): string {
  return month
    .slice(0, 3)
    .toLowerCase()
    .replace(/^./, c => c.toUpperCase());
}

// An object with details about each iteration.
export interface IterationLookup {
  // Lookup iteration by date in YYYY-MM-DD format
  byDate: { [date: string]: string };
  // Lookup date information by iteration string e.g. "100.1"
  byVersionString: {
    [versionString: string]: {
      startDate: string; // In DateTime ISO format with timezone
      endDate: string;
      weeks: number; // Number of Mondays spent in the iteration
    };
  };
  // List of version, ordered by iteration number
  orderedVersionStrings: string[];
}

/**
 * Manual overrides for the iteration lookup below. This can be used to fix
 * erroneous iteration numbers and date ranges on Bugzilla. It can't be used to
 * add new iterations, since that would require sorting, which is slow.
 * @example { iteration: "66.1", range: "Dec 10 - 23" }
 * @example { iteration: "66.2", range: null } // use null to exclude iterations
 */
const ITERATION_OVERRIDES = [];

/**
 * For a given list of iteration strings, return an object with lookup tables
 * for iteration strings and dates. Each string must have an iteration number
 * (e.g. 100.1) and a date range. Order is important so the date computations
 * work correctly, and so we're able to parse duplicates as overrides.
 * @example ["101.1 - April 4 - April 15", "101.2 - April 18 - April 29"]
 */
async function makeIterationLookup(
  iterations: string[]
): Promise<IterationLookup> {
  const iterationsByRange: Map<string, string> = new Map();
  const rangesByIteration: Map<string, string> = new Map();
  const STARTING_VERSION = 67;
  // Remove duplicate date ranges (override in insertion order)
  for (const value of iterations) {
    const match = value.match(/(\d+)\.(\d+) - (.*)/);
    if (match) {
      const version = parseInt(match[1], 10);
      // Ignore iterations before 67.1
      if (version < STARTING_VERSION) continue;
      const iterationString = `${match[1]}.${match[2]}`;
      iterationsByRange.set(match[3], iterationString);
    }
  }
  // Remove duplicate versions
  for (const [range, iteration] of iterationsByRange) {
    rangesByIteration.set(iteration, range);
  }
  // Add manual overrides
  for (const { iteration, range } of ITERATION_OVERRIDES) {
    if (range) {
      rangesByIteration.set(iteration, range);
    } else {
      rangesByIteration.delete(iteration);
    }
  }

  const result: IterationLookup = {
    byDate: {},
    byVersionString: {},
    orderedVersionStrings: [],
  };
  // In order to generate actual dates, we need to infer the year, since
  // iterations aren't stored with years. We do this by using the starting
  // version date as the epoch, and incrementing the year by one each time we
  // see an iteration's start date has a month before the previous iteration's
  // start date month.
  let lastDate: DateTime;
  let lastMonth = -1;
  let year = 2019;
  for (const [iteration, range] of rangesByIteration) {
    // We can handle dates of the forms "July 3 - 14" and "Aug 28 - Sept 8"
    // (where the end date falls in a different month than the start date).
    const match = range.match(/(\w+) (\d+) ?- ?(?:(\w+) )?(\d+)/);
    if (match) {
      const startMonth = normalizeMonthString(match[1]);
      const endMonth = match[3] ? normalizeMonthString(match[3]) : startMonth;
      let startDate = DateTime.fromFormat(
        `${startMonth} ${match[2]} ${year}`,
        "LLL d y",
        { locale: "en-US" }
      );
      if (startDate.month < lastMonth) {
        year += 1;
      }
      startDate = startDate.set({ year }).startOf("week");
      lastMonth = startDate.month;
      while (lastDate && startDate < lastDate) {
        // This iteration starts before the previous iteration ended. That means
        // we actually want it to start on the first Monday after the start.
        startDate = startDate.plus({ weeks: 1 });
      }
      const startDateTime = startDate.startOf("day").toISO();
      let endDate = DateTime.fromFormat(
        `${endMonth} ${match[4]} ${year}`,
        "LLL d y",
        { locale: "en-US" }
      );
      if (endDate.month < lastMonth) {
        year += 1;
      }
      // If the end date is a Monday, set it to the previous Sunday.
      if (endDate.weekday === 1) {
        endDate = endDate.minus({ days: 1 });
      }
      // Otherwise, set it to the next Sunday.
      endDate = endDate.set({ year }).endOf("week");
      lastDate = endDate;
      lastMonth = lastDate.month;
      const endDateTime = endDate.startOf("day").toISO();
      const weeks = Math.ceil(endDate.diff(startDate, "days").days / 7);
      if (startDateTime && endDateTime && weeks) {
        result.byVersionString[iteration] = {
          startDate: startDateTime,
          weeks,
          endDate: endDateTime,
        };
        result.orderedVersionStrings.push(iteration);
        const start = DateTime.fromISO(startDateTime);
        for (let i = 0; i < weeks; i++) {
          const monday = start.plus({ weeks: i });
          result.byDate[monday.toFormat("yyyy-MM-dd")] = iteration;
        }
      }
    }
  }
  return result;
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
            return reject(error);
          }
          let parsed: FieldsResponse;
          try {
            parsed = JSON.parse(body);
          } catch (e) {
            console.log(body);
            console.error(e);
            return reject(e);
          }
          resolve(
            makeIterationLookup(
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
