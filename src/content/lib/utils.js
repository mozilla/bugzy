import {prefs} from "./prefs";
import {postProcess} from "./postProcess";

const FAKE_TIME = new Date().toISOString();
const FAKE_BUGS = [
  {
    id: 1441984,
    whiteboard: "[Message Center]",
    summary: "Add section reordering, snippets IndexedDB, strings, bug fixes to a Activity Stream",
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

export async function runQuery(query) {
  if (prefs.get("offline_debug")) {
    return FAKE_BUGS;
  }
  let data = {};
  const resp = await fetch("/api/bugs", {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(query),
    method: "POST",
  });
  try {
    data = await resp.json();
  } catch (e) {
    console.log(resp); // eslint-disable-line
    console.log(query); // eslint-disable-line
    console.error(e); // eslint-disable-line
  }

  return postProcess(data);
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
    document.getSelection().rangeCount > 0 ? document.getSelection().getRangeAt(0) : false;
  el.select();
  document.execCommand("copy");
  document.body.removeChild(el);
  if (selected) {
    document.getSelection().removeAllRanges();
    document.getSelection().addRange(selected);
  }
}
