import React from "react";
import { GlobalContext, MetaBug } from "../GlobalContext/GlobalContext";
import { BugList } from "../BugList/BugList";
import { useBugFetcher, Bug, BugQuery } from "../../hooks/useBugFetcher";
import { Container } from "../ui/Container/Container";
import { LegacyIteration } from "../../../common/IterationLookup";
import { Tabs } from "../ui/Tabs/Tabs";
import { Loader, MiniLoader } from "../Loader/Loader";
import { CompletionBar } from "../CompletionBar/CompletionBar";
import { isBugResolved } from "../../lib/utils";
import { teams as emailLists } from "../../../config/people";
import priorityStyles from "../PriorityGuide/PriorityGuide.module.scss";

interface GetQueryOptions {
  iteration: string;
  metas: MetaBug[];
  components: string[];
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
            .filter(m => options.components.includes(m.component))
            .map(m => m.id)
            .join(","),
        },
        {
          key: "component",
          operator: "anyexact",
          value: options.components.join(","),
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

interface IterationViewTabProps extends IterationViewProps {
  components: string[];
}

const IterationViewTab: React.FunctionComponent<
  IterationViewTabProps
> = props => {
  const { metas, qm, teams } = React.useContext(GlobalContext);
  const query = React.useMemo(
    () => getQuery({ ...props, metas }),
    [metas, props]
  );
  const state = useBugFetcher({ query, qm });

  const bugsByMeta = sortByMeta(metas, state.bugs);
  const isLoaded = state.status === "loaded";
  const isCurrent = props.iteration === props.currentIteration.number;
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
              <span
                className={`${priorityStyles.inline} ${
                  priorityStyles[tShirtSize.toLowerCase()]
                }`}>
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
                <span
                  className={`${priorityStyles.inline} ${priorityStyles.total}`}>
                  {points} {points === 1 ? "pt" : "pts"}
                </span>
              </>
            ) : null}
          </>
        ) : null}
      </>
    );
  }, []);
  return isLoaded ? (
    <React.Fragment>
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
            />
          );
        })}
      </div>
      <div
        style={{ display: "flex", flexFlow: "row nowrap", fontSize: "14px" }}>
        <ul
          style={{ marginTop: "0", paddingInline: "20px", lineHeight: "22px" }}>
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
          style={{ marginTop: "0", paddingInline: "20px", lineHeight: "22px" }}>
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
    </React.Fragment>
  ) : (
    <Loader />
  );
};

export const IterationView: React.FunctionComponent<
  IterationViewProps
> = props => {
  const isCurrent = props.iteration === props.currentIteration.number;
  const heading = `${isCurrent ? "Current " : ""}Iteration (${
    props.iteration
  })`;
  return (
    <Container loaded={true} heading={heading}>
      <Tabs
        baseUrl={props.match.url}
        config={[
          {
            path: "",
            label: "User Journey",
            render() {
              return (
                <IterationViewTab
                  {...props}
                  components={["Messaging System"]}
                  currentIteration={props.currentIteration}
                />
              );
            },
          },
          {
            path: "/pocket",
            label: "Pocket",
            render() {
              return (
                <IterationViewTab
                  {...props}
                  components={["Pocket"]}
                  currentIteration={props.currentIteration}
                />
              );
            },
          },
          {
            path: "/new-tab",
            label: "New Tab",
            render() {
              return (
                <IterationViewTab
                  {...props}
                  components={["New Tab Page"]}
                  currentIteration={props.currentIteration}
                />
              );
            },
          },
        ]}
      />
    </Container>
  );
};
