import { prefs } from "./prefs";
import { cache, CacheableRequest } from "./cache";

const FAKE_TIME = new Date().toISOString();
const FAKE_BUGS = [
  {
    id: 1441984,
    whiteboard: "[Message Center]",
    summary:
      "Add section reordering, snippets IndexedDB, strings, bug fixes to a Activity Stream",
    assigned_to: "khudson@mozilla.com",
    priority: "P1",
    last_change_time: FAKE_TIME,
    status: "RESOLVED",
  },
  {
    id: 1384094,
    whiteboard: "[Perf]",
    summary:
      "High CPU. network traffic and memory usage when open Newtab page if you have opened / bookmarked a problematic/ huge game page in the past",
    assigned_to: "khudson@mozilla.com",
    priority: "P1",
    last_change_time: FAKE_TIME,
    status: "ASSIGNED",
  },
  {
    id: 1421682,
    whiteboard: "",
    summary:
      "Activity Streams exhausts file descriptors capturing screenshots when large numbers of bookmarks are added at once",
    assigned_to: "khudson@mozilla.com",
    priority: "P1",
    last_change_time: FAKE_TIME,
    status: "ASSIGNED",
  },
];

export class BugsRequest extends CacheableRequest {
  constructor(query) {
    super("/api/bugs", {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(query),
      method: "POST",
    });
  }
}

export class QueryManager {
  constructor({ postProcessFn = data => data } = {}) {
    this._postProcess = postProcessFn;
    for (const key of [
      "runQuery",
      "runQueries",
      "matchQuery",
      "matchQueries",
      "runCachedQueries",
    ]) {
      this[key] = this[key].bind(this);
    }
  }

  async runQuery(query) {
    if (prefs.get("offline_debug")) {
      return FAKE_BUGS;
    }
    let data = {};
    let request = new BugsRequest(query);
    let resp = await fetch(request);
    await cache.set(request, resp);
    try {
      data = await resp.json();
    } catch (e) {
      console.log(resp); // eslint-disable-line
      console.log(query); // eslint-disable-line
      console.error(e); // eslint-disable-line
    }
    return this._postProcess(data);
  }

  runQueries(queries) {
    return Array.isArray(queries)
      ? Promise.all(queries.map(this.runQuery))
      : this.runQuery(queries);
  }

  async matchQuery(query) {
    if (prefs.get("offline_debug")) {
      return FAKE_BUGS;
    }
    if (prefs.get("disable_cache")) {
      throw new Error("Cache disabled");
    }
    let data;
    const response = await cache.get(new BugsRequest(query));
    if (response) {
      try {
        data = await response.json();
      } catch (e) {
        console.log("Error parsing cached response :>> ", response); // eslint-disable-line
        console.log(query); // eslint-disable-line
        console.error(e); // eslint-disable-line
      }
      if (data) {
        return this._postProcess(data);
      }
    }
    throw new Error("No cached response");
  }

  matchQueries(queries) {
    return Array.isArray(queries)
      ? Promise.all(queries.map(this.matchQuery))
      : this.matchQuery(queries);
  }

  /**
   * @typedef {import("../hooks/useBugFetcherTypes").BugQuery} BugQuery
   * @typedef {import("../hooks/useBugFetcherTypes").BugQueryReturn} BugQueryReturn
   * @typedef {import("../hooks/useBugFetcherTypes").BugQueriesReturn} BugQueriesReturn
   * @typedef {function(BugQueryReturn|BugQueriesReturn)} BugQueryCallback
   * @typedef {function()} BugQueryPredicate
   */
  /**
   * For a given query or array of queries, return the results from the cache if
   * available and execute a passed callback. Then fetch fresh results from the
   * server, cache them, and execute the callback again. This allows us to render
   * cached data while waiting for new data from the network.
   * @param {BugQuery|BugQuery[]} queries query/queries to match and run
   * @param {BugQueryPredicate} predicate return true if the callback should run
   * @param {BugQueryCallback} cb callback to run if the predicate returns true
   */
  async runCachedQueries(queries, predicate, cb) {
    try {
      // Try to get a cached response that matches the query
      const rsp = await this.matchQueries(queries);
      if (cb && predicate()) {
        await cb({ rsp, awaitingNetwork: true });
      }
    } catch (e) {}

    // Now get fresh data from network
    const rsp = await this.runQueries(queries);
    if (cb && predicate()) {
      await cb({ rsp, awaitingNetwork: false });
    }
  }
}

// export function runQuery(query) {
//   if (prefs.get("offline_debug")) return Promise.resolve(FAKE_BUGS);
//   return new Promise(async (resolve) => {
//     const id = Math.random();
//     const onData = (e, resp) => {
//       if (resp.id === id) {
//         ipcRenderer.removeListener("responseRunQuery", onData);
//         resolve(resp.data);
//       }
//     };
//     ipcRenderer.on("responseRunQuery", onData);
//     ipcRenderer.send("runQuery", {id, query});
//   });
// }

export function isBugResolved(bug) {
  return ["RESOLVED", "VERIFIED", "CLOSED"].includes(bug.status);
}

export function isBugResolvedOrMerged(bug) {
  return (
    ["RESOLVED", "VERIFIED", "CLOSED"].includes(bug.status) ||
    (bug.keywords && bug.keywords.includes("github-merged"))
  );
}

export function copyToClipboard(string) {
  // From https://hackernoon.com/copying-text-to-clipboard-with-javascript-df4d4988697f
  // Must be triggered by a user action in order to work
  const el = document.createElement("textarea");
  el.value = string;
  el.setAttribute("readonly", "");
  el.style.position = "absolute";
  el.style.left = "-9999px";
  document.body.appendChild(el);
  const selected =
    document.getSelection().rangeCount > 0
      ? document.getSelection().getRangeAt(0)
      : false;
  el.select();
  document.execCommand("copy");
  document.body.removeChild(el);
  if (selected) {
    document.getSelection().removeAllRanges();
    document.getSelection().addRange(selected);
  }
}
