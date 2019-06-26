const express = require("express");
const { fetchQuery } = require("./server/queryUtils");
const path = require("path");
const bodyParser = require("body-parser");
const { DateTime } = require("luxon");
const { EPIC_BUG_NUMBER } = require("./config/project_settings");
const { removeMeta } = require("./common/removeMeta");
const app = express();

app.use(bodyParser.json());
app.use(express.static(path.resolve(__dirname, "./content")));

const metasCache = { data: null, lastUpdated: null };
app.get("/api/metas", async (req, res) => {
  const now = DateTime.local();
  if (
    !metasCache.data ||
    !metasCache.lastUpdated ||
    now.diff(metasCache.lastUpdated, "hours") > 3 ||
    req.query.force
  ) {
    try {
      const { bugs } = await fetchQuery({
        include_fields: [
          "id",
          "summary",
          "cf_fx_iteration",
          "priority",
          "status",
          "component",
        ],
        rules: [
          { key: "blocked", operator: "equals", value: EPIC_BUG_NUMBER },
          { key: "keywords", operator: "anyexact", value: "meta" },
        ],
      });
      if (bugs && bugs.length) {
        metasCache.data = bugs.map(bug => ({
          id: bug.id,
          displayName: removeMeta(bug.summary),
          priority: bug.priority,
          release: bug.cf_fx_iteration.split(".")[0],
          status: bug.status,
          component: bug.component,
        }));
      }
      metasCache.lastUpdated = DateTime.local();
    } catch (e) {
      // Don't update if the data is bad
    }
  }
  res.send(metasCache.data);
});

app.get("/refresh_metas", (req, res) => {
  metasCache.data = null;
  metasCache.lastUpdated = null;
  res.end();
});

app.post("/api/bugs", async (req, res) => {
  const data = await fetchQuery(req.body);
  res.send(data);
});

app.get("*", (request, response) => {
  response.sendFile(path.resolve(__dirname, "./content", "index.html"));
});

const port = process.env.PORT || "1989";
app.listen(port, () => console.log(`Bugzy server running on ${port}!`)); // eslint-disable-line no-console
