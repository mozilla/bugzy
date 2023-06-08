import { EPIC_BUG_NUMBER } from "./config/project_settings";
import {
  fetchQuery,
  fetchRemoteSettingsMessages,
  fetchIterations,
  fetchReleaseData,
} from "./server/queryUtils";
import { ServerCache } from "./server/ServerCache";
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

const metasCache = new ServerCache({ hours: 3 });
app.get("/api/metas", async (req, res) => {
  if (metasCache.isExpired() || req.query.force) {
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
    } catch (e) {
      // Don't update if the data is bad
    }
  }
  res.send(metasCache.data);
});

app.get("/refresh_metas", (req, res) => {
  metasCache.data = null;
  metasCache.expirationDate = null;
  res.end();
});

const iterationsCache = new ServerCache({ days: 1 });
app.get("/api/iterations", async (req, res) => {
  if (iterationsCache.isExpired() || req.query.force) {
    try {
      const iterationsLookup = await fetchIterations();
      if (iterationsLookup) {
        iterationsCache.data = iterationsLookup;
      }
    } catch (e) {
      // Don't update if the data is bad
    }
  }
  res.send(iterationsCache.data);
});

app.get("/refresh_iterations", (req, res) => {
  iterationsCache.data = null;
  iterationsCache.expirationDate = null;
  res.end();
});

const releasesCache = new ServerCache({ hours: 6 });
app.get("/api/releases", async (req, res) => {
  if (releasesCache.isExpired() || req.query.force) {
    try {
      const releases = await fetchReleaseData();
      if (releases && releases.beta.date && releases.release.date) {
        releasesCache.data = releases;
      }
    } catch (e) {
      // Don't update if the data is bad
    }
  }
  res.send(releasesCache.data);
});

app.post("/api/bugs", async (req, res) => {
  const data = await fetchQuery(req.body);
  res.send(data);
});

app.get("/remote-settings", async (req, res) => {
  const data = await fetchRemoteSettingsMessages(req.query.uri);
  res.send(data);
});

app.get("*", (request, response) => {
  response.sendFile(path.resolve(__dirname, "./content", "index.html"));
});

const port = process.env.PORT || "1989";
app.listen(port, () => console.log(`Bugzy server running on ${port}!`)); // eslint-disable-line no-console
