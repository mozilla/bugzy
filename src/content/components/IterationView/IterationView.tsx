import React from "react";
import { Link } from "react-router-dom";
import { GlobalContext, MetaBug } from "../GlobalContext/GlobalContext";
import { BugList } from "../BugList/BugList";
import { useBugFetcher, Bug, BugQuery } from "../../hooks/useBugFetcher";
import { Container } from "../ui/Container/Container";
import { LegacyIteration } from "../../../common/IterationLookup";
import { MiniLoader } from "../Loader/Loader";
import { CompletionBar } from "../CompletionBar/CompletionBar";
import { isBugResolved } from "../../lib/utils";
import { teams as emailLists } from "../../../config/people";
import { BUGZILLA_TRIAGE_COMPONENTS } from "../../../config/project_settings";
import * as styles from "./IterationView.module.scss";
import * as priorityStyles from "../PriorityGuide/PriorityGuide.module.scss";

interface GetQueryOptions {
  iteration: string;
  metas: MetaBug[];
}

const COLUMNS = [
  "id",
  "type",
  "summary",
  "assigned_to",
  "priority",
  "cf_fx_points",
];

const getQuery = (options: GetQueryOptions): BugQuery => ({
  include_fields: [
    "id",
    "summary",
    "assigned_to",
    "priority",
    "status",
    "whiteboard",
    "keywords",
    "type",
    "flags",
    "blocks",
    "component",
    "cf_fx_points",
    "resolution",
  ],
  rules: [
    { key: "cf_fx_iteration", operator: "substring", value: options.iteration },
    {
      operator: "OR",
      rules: [
        {
          key: "blocked",
          operator: "anywordssubstr",
          value: options.metas
            .filter(m => BUGZILLA_TRIAGE_COMPONENTS.includes(m.component))
            .map(m => m.id)
            .join(","),
        },
        {
          key: "component",
          operator: "anyexact",
          value: BUGZILLA_TRIAGE_COMPONENTS.join(","),
        },
      ],
    },
  ],
});

interface SortByMetaReturn {
  [metaNumber: string]: { meta: MetaBug; bugs: Bug[] };
}

function sortByMeta(allMetas: Array<MetaBug>, bugs: any[]): SortByMetaReturn {
  let bugsByMeta = {};

  bugs?.forEach(bug => {
    const metas = allMetas.filter(
      meta => meta.priority === "P1" && bug.blocks.includes(meta.id)
    );
    if (!metas.length) {
      metas.push({ id: "other", displayName: "Other" });
    }

    metas.forEach(meta => {
      if (!bugsByMeta[meta.id]) {
        bugsByMeta[meta.id] = { meta, bugs: [] };
      }
      bugsByMeta[meta.id].bugs.push(bug);
    });
  });
  return bugsByMeta;
}

interface IterationViewProps {
  /* e.g. "65.4" */
  iteration: string;
  currentIteration: LegacyIteration;
  match: { url: string };
}

export const IterationView: React.FunctionComponent<
  IterationViewProps
> = props => {
  const isCurrent = props.iteration === props.currentIteration.number;
  const { metas, qm, teams, iterations } = React.useContext(GlobalContext);
  const query = React.useMemo(
    () => getQuery({ ...props, metas }),
    [metas, props]
  );
  const state = useBugFetcher({ query, qm });

  const bugsByMeta = sortByMeta(metas, state.bugs);
  const isLoaded = state.status === "loaded";
  const maybeAddPoints = React.useCallback(
    (bug, rv) => {
      const email =
        !bug.assigned_to || bug.assigned_to === "nobody@mozilla.org"
          ? "unassigned"
          : bug.assigned_to;
      if (!emailLists.omc.includes(email)) {
        return;
      }
      if (!rv[email]) {
        rv[email] = {
          bugs: 0,
          points: 0,
          user: teams.omc.find(e => [e.name, e.email].includes(email)),
        };
      }
      rv[email].bugs++;
      rv.total.bugs++;
      const points = Number(bug.cf_fx_points);
      if (points > 0) {
        rv[email].points += points;
        rv.total.points += points;
      }
    },
    [teams.omc]
  );
  const pointLists = React.useMemo(() => {
    let rv = {
      remainingPoints: { total: { bugs: 0, points: 0 } },
      finishedPoints: { total: { bugs: 0, points: 0 } },
    };
    for (let bug of state.bugs) {
      if (!isBugResolved(bug)) {
        maybeAddPoints(bug, rv.remainingPoints);
      } else if (bug.resolution === "FIXED") {
        maybeAddPoints(bug, rv.finishedPoints);
      }
    }
    return rv;
  }, [maybeAddPoints, state.bugs]);
  const formatPointsFor = React.useCallback(
    ({ bugs, points, user: { real_name, nick }, email }) => {
      let tShirtSize: string;
      if (points < 3) {
        tShirtSize = "SM";
      } else if (points < 8) {
        tShirtSize = "MD";
      } else if (points < 15) {
        tShirtSize = "LG";
      } else {
        tShirtSize = "XL";
      }
      return (
        <li key={email}>
          {real_name || nick || email}: {bugs} {bugs === 1 ? "bug" : "bugs"}
          {points ? (
            <>
              {" "}
              <span className={priorityStyles[tShirtSize.toLowerCase()]}>
                {points} {points === 1 ? "pt" : "pts"}
              </span>
            </>
          ) : null}
        </li>
      );
    },
    []
  );
  const formatPointsList = React.useCallback(
    list => {
      let items = Object.keys(list)
        .map(email =>
          email === "total" ? null : formatPointsFor({ ...list[email], email })
        )
        .filter(Boolean);
      if (items.length) {
        return items;
      }
      return null;
    },
    [formatPointsFor]
  );
  const formatPointsTitle = React.useCallback(({ title, bugs, points }) => {
    return (
      <>
        {title}
        {bugs > 0 ? (
          <>
            : {bugs} {bugs === 1 ? "bug" : "bugs"}
            {points ? (
              <>
                {" "}
                <span className={priorityStyles.total}>
                  {points} {points === 1 ? "pt" : "pts"}
                </span>
              </>
            ) : null}
          </>
        ) : null}
      </>
    );
  }, []);
  const getBugWarning = React.useCallback(
    (bug: Bug) => {
      if (!metas.some(m => bug.blocks?.includes(m.id))) {
        return {
          type: "no-meta",
          message:
            "This bug is not blocking any meta bug in Messaging System. Please add a meta bug!",
        };
      }
      return {};
    },
    [metas]
  );
  const heading = React.useMemo(() => {
    // Hide the next arrow if we're on the current iteration, since the next
    // iteration is generally empty.
    const nextIteration = isCurrent
      ? null
      : iterations.getAdjacentIteration(1, props.iteration);
    const prevIteration = iterations.getAdjacentIteration(-1, props.iteration);
    let headingString = isCurrent
      ? `Current Iteration (${props.iteration})`
      : `Iteration ${props.iteration}`;
    return {
      title: headingString,
      heading: (
        <div className={styles.iterationHeading}>
          <div className={styles.iterationSpacer}>
            {prevIteration ? (
              <Link
                className={styles.iterationArrow}
                to={`/iteration/${prevIteration.number}`}
                aria-label={`Previous iteration: ${prevIteration.number}`}>
                ◀
              </Link>
            ) : null}
          </div>
          {headingString}
          <div className={styles.iterationSpacer}>
            {nextIteration ? (
              <Link
                className={styles.iterationArrow}
                to={`/iteration/${nextIteration.number}`}
                aria-label={`Next iteration: ${nextIteration.number}`}>
                ▶
              </Link>
            ) : null}
          </div>
        </div>
      ),
    };
  }, [isCurrent, iterations, props.iteration]);
  return (
    <Container
      loaded={isLoaded}
      heading={heading.heading}
      title={heading.title}>
      {isCurrent ? (
        <CompletionBar
          startDate={props.currentIteration.start}
          endDate={props.currentIteration.due}
          bugs={state.bugs}
        />
      ) : null}
      <div style={{ marginTop: "20px" }}>
        {Object.keys(bugsByMeta).map(id => {
          const { meta, bugs } = bugsByMeta[id];
          return (
            <BugList
              key={meta.id}
              compact={true}
              subtitle={meta.displayName}
              tags={true}
              bulkEdit={true}
              showHeaderIfEmpty={true}
              bugs={bugs}
              columns={COLUMNS}
              getBugWarning={getBugWarning}
            />
          );
        })}
      </div>
      <div
        style={{
          display: "flex",
          flexFlow: "row nowrap",
          fontSize: "14px",
        }}>
        <ul
          style={{
            marginTop: "0",
            paddingInline: "20px",
            lineHeight: "22px",
          }}>
          <h4 style={{ marginBottom: "0", marginInlineStart: "-1em" }}>
            {formatPointsTitle({
              title: "Remaining work",
              ...pointLists.remainingPoints.total,
            })}
          </h4>
          {formatPointsList(pointLists.remainingPoints) ?? (
            <span style={{ marginBottom: "0", marginInlineStart: "-1em" }}>
              No remaining work
            </span>
          )}
        </ul>
        <div style={{ flexGrow: 1 }} />
        <ul
          style={{
            marginTop: "0",
            paddingInline: "20px",
            lineHeight: "22px",
          }}>
          <h4 style={{ marginBottom: "0", marginInlineStart: "-1em" }}>
            {formatPointsTitle({
              title: "Finished work",
              ...pointLists.finishedPoints.total,
            })}
          </h4>
          {formatPointsList(pointLists.finishedPoints) ?? (
            <span style={{ marginBottom: "0", marginInlineStart: "-1em" }}>
              No finished work
            </span>
          )}
        </ul>
      </div>
      <MiniLoader hidden={!state.awaitingNetwork} />
    </Container>
  );
};
