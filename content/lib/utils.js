export const AS_COMPONENTS = ["Activity Streams: Newtab", "New Tab Page", "Activity Streams: Application Servers"];
const {ipcRenderer, shell} = window.require("electron");
import {prefs} from "./prefs";

const fakeDate = new Date().toISOString();
const FAKE_BUGS = [
  {id: 12132131, whiteboard: "[foo][bar]", summary: "Do stuff", assigned_to: "khudson@mozilla.com", priority: "P1", last_change_time: fakeDate, status: "RESOLVED"},
  {id: 23234222, whiteboard: "[foo][bar]", summary: "Do other stuff", assigned_to: "khudson@mozilla.com", priority: "P1", last_change_time: fakeDate, status: "NEW"},
  {id: 32892382, summary: "Think about stuff", assigned_to: "abc@mozilla.com", priority: "P1", last_change_time: fakeDate, status: "NEW"},
  {id: 23424224, summary: "Fasasda", assigned_to: "zasd@mozilla.com", priority: "P1", last_change_time: fakeDate, status: "NEW"}
];

export function runQuery(query) {
  if (prefs.get("offline_debug")) return Promise.resolve(FAKE_BUGS);
  return new Promise(async (resolve) => {
    const id = Math.random();
    const onData = (e, resp) => {
      if (resp.id === id) {
        ipcRenderer.removeListener("responseRunQuery", onData);
        resolve(resp.data);
      }
    };
    ipcRenderer.on("responseRunQuery", onData);
    ipcRenderer.send("runQuery", {id, query});
  });
}
