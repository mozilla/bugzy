import {
  BUGZILLA_PRODUCT,
  BUGZILLA_TRIAGE_COMPONENTS,
  EPIC_BUG_NUMBER,
} from "./config/project_settings";
import {
  fetchQuery,
  fetchRemoteSettingsMessages,
  fetchIterations,
  fetchReleaseData,
  fetchUsers,
  fetchTriageOwnerEmail,
} from "./server/queryUtils";
import { ServerCache } from "./server/ServerCache";
import { removeMeta } from "./common/removeMeta";
import { teams } from "./config/people";
import express from "express";
import path from "path";
import bodyParser from "body-parser";
const app = express();

app.use(function (req, res, next) {
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
// eslint-disable-next-line no-eval
const dirName = eval("__dirname");
app.use(express.static(path.resolve(dirName, "./content")));

const metasCache = new ServerCache({ name: "Metas", maxAge: { hours: 3 } });
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

const iterationsCache = new ServerCache({
  name: "Iterations",
  maxAge: { days: 1 },
});
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

const releasesCache = new ServerCache({
  name: "Releases",
  maxAge: { hours: 6 },
});
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

const teamsCache = new ServerCache({
  name: "Teams",
  maxAge: { days: 1 },
  // Refresh before triage meeting to ensure triage owner is up-to-date. The
  // triage owner on Bugzilla is synced with Google Calendar every weekday at
  // 12:00 UTC, so we refresh on Mondays at 12:30 UTC.
  interval: { weekday: "monday", hour: 12, minute: 30 },
});
app.get("/api/teams", async (req, res) => {
  if (teamsCache.isExpired() || req.query.force) {
    try {
      let detailedTeams: { [key: string]: any[] } = {};
      for (const team of Object.keys(teams)) {
        try {
          const emails = teams[team];
          const resp = await fetchUsers(emails);
          if (resp?.users) {
            detailedTeams[team] = resp.users;
            let triageOwnerEmail = await fetchTriageOwnerEmail({
              product: BUGZILLA_PRODUCT,
              component: BUGZILLA_TRIAGE_COMPONENTS[0],
            });
            if (triageOwnerEmail && emails.includes(triageOwnerEmail)) {
              let triageOwner = detailedTeams[team].find(
                u => u.email === triageOwnerEmail
              );
              if (triageOwner) {
                triageOwner.is_triage_owner = true;
              }
            }
          }
        } catch (e) {
          // Skip this team if the data is bad
        }
      }
      if (Object.keys(detailedTeams).length) {
        teamsCache.data = detailedTeams;
      }
    } catch (e) {
      // Don't update if the data is bad
    }
  }
  res.send(teamsCache.data);
});

app.get("/flush_server_caches", (req, res) => {
  metasCache.data = null;
  metasCache.expirationDate = null;
  iterationsCache.data = null;
  iterationsCache.expirationDate = null;
  releasesCache.data = null;
  releasesCache.expirationDate = null;
  teamsCache.data = null;
  teamsCache.expirationDate = null;
  res.end();
});

app.post("/api/bugs", async (req, res) => {
  const data = await fetchQuery(req.body);
  res.send(data);
});

app.get("/remote-settings", async (req, res) => {
  const data = await fetchRemoteSettingsMessages(req.query.uri as string);
  res.send(data);
});

app.get("*", (request, response) => {
  response.sendFile(path.resolve(dirName, "./content", "index.html"));
});

const port = process.env.PORT || "1989";
app.listen(port, () => console.log(`Bugzy server running on ${port}!`)); // eslint-disable-line no-console
