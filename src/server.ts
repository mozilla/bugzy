import { DateTime } from "luxon";
import { EPIC_BUG_NUMBER } from "./config/project_settings";
import {
  fetchQuery,
  fetchRemoteSettingsMessages,
  fetchIterations,
  updateBugs,
  fetchPriorities,
} from "./server/queryUtils";
import { removeMeta } from "./common/removeMeta";

const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const app = express();

app.use(function(req, res, next) {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.PRODUCTION_URL &&
    req.headers["x-forwarded-proto"] !== "https"
  ) {
    return res.redirect([process.env.PRODUCTION_URL, req.url].join(""));
  }

  return next();
});

app.use(bodyParser.json());
app.use(express.static(path.resolve(__dirname, "./content")));

const metasCache = { data: null, lastUpdated: null };
app.get("/api/metas", async (req, res) => {
  const now = DateTime.local();
  if (
    !metasCache.data ||
    !metasCache.lastUpdated ||
    now.diff(metasCache.lastUpdated, "hours").hours > 3 ||
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
          "blocks",
        ],
        rules: [
          { key: "blocked", operator: "equals", value: EPIC_BUG_NUMBER },
          { key: "keywords", operator: "anyexact", value: "meta" },
        ],
      });
      if (bugs && bugs.length) {
        metasCache.data = bugs.map(bug => ({
          ...bug,
          displayName: removeMeta(bug.summary),
          release: bug.cf_fx_iteration.split(".")[0],
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

const iterationsCache = { data: null, lastUpdated: null };
app.get("/api/iterations", async (req, res) => {
  const now = DateTime.local();
  if (
    !iterationsCache.data ||
    !iterationsCache.lastUpdated ||
    now.diff(iterationsCache.lastUpdated, "days").days >= 1 ||
    req.query.force
  ) {
    try {
      const iterationsLookup = await fetchIterations();
      if (iterationsLookup) {
        iterationsCache.data = iterationsLookup;
      }
      iterationsCache.lastUpdated = DateTime.local();
    } catch (e) {
      // Don't update if the data is bad
    }
  }
  res.send(iterationsCache.data);
});

const prioritiesCache = { data: null, lastUpdated: null };
app.get("/api/priorities", async (req, res) => {
  const now = DateTime.local();
  if (
    !prioritiesCache.data ||
    !prioritiesCache.lastUpdated ||
    now.diff(prioritiesCache.lastUpdated, "days").days >= 1 ||
    req.query.force
  ) {
    try {
      const prioritiesLookup = await fetchPriorities();
      if (prioritiesLookup) {
        prioritiesCache.data = prioritiesLookup;
      }
      prioritiesCache.lastUpdated = DateTime.local();
    } catch (e) {
      // Don't update if the data is bad
    }
  }
  res.send(prioritiesCache.data);
});

app.get("/refresh_iterations", (req, res) => {
  iterationsCache.data = null;
  iterationsCache.lastUpdated = null;
  res.end();
});

app.post("/api/bugs", async (req, res) => {
  const data = await fetchQuery(req.body);
  res.send(data);
});

app.get("/remote-settings", async (req, res) => {
  const data = await fetchRemoteSettingsMessages(req.query.uri);
  res.send(data);
});

app.put("/api/bug/:id", async (req, res) => {
  const data = await updateBugs(req.params.id, req.body);
  res.send(data);
});

app.get("*", (request, response) => {
  response.sendFile(path.resolve(__dirname, "./content", "index.html"));
});

const port = process.env.PORT || "1989";
app.listen(port, () => console.log(`Bugzy server running on ${port}!`)); // eslint-disable-line no-console
