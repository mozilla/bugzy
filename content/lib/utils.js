export const AS_COMPONENTS = ["Activity Streams: Newtab", "New Tab Page", "Activity Streams: Application Servers"];
const {ipcRenderer, shell} = window.require("electron");

export function runQuery(query) {
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
