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
import { emails } from "../../../config/people";

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

interface BugProps {
  id: any;
  summary: string;
  assigned_to?: string;
  priority?: string;
  status?: string;
  whiteboard?: string;
  keywords?: string;
  type?: string;
  flags?: string;
  blocks?: string;
  component: string;
}

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

const IterationViewTab: React.FunctionComponent<IterationViewTabProps> = props => {
  const { metas, qm } = React.useContext(GlobalContext);
  const query = React.useMemo(() => getQuery({ ...props, metas }), [
    metas,
    props,
  ]);
  const state = useBugFetcher({ query, qm });

  const bugsByMeta = sortByMeta(metas, state.bugs);
  const isLoaded = state.status === "loaded";
  const isCurrent = props.iteration === props.currentIteration.number;
  const pointsPerPerson = { total: { bugs: 0, points: 0 } };
  state.bugs.forEach(bug => {
    if (!isBugResolved(bug)) {
      const email =
        !bug.assigned_to || bug.assigned_to === "nobody@mozilla.org"
          ? "unassigned"
          : bug.assigned_to;
      const person = emails[email] || email;
      if (!pointsPerPerson[person]) {
        pointsPerPerson[person] = { bugs: 0, points: 0 };
      }
      pointsPerPerson[person].bugs++;
      pointsPerPerson.total.bugs++;
      const points = Number(bug.cf_fx_points);
      if (points > 0) {
        pointsPerPerson[person].points += points;
        pointsPerPerson.total.points += points;
      }
    }
  });
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
      <h4 style={{ marginBottom: 0 }}>Remaining work per person</h4>
      {Object.keys(pointsPerPerson).map(person => {
        const { bugs, points } = pointsPerPerson[person];
        return (
          <li key={person}>
            {person}: {bugs} bugs
            {points ? ` (${points} points)` : ""}
          </li>
        );
      })}
      <MiniLoader hidden={!state.awaitingNetwork} />
    </React.Fragment>
  ) : (
    <Loader />
  );
};

export const IterationView: React.FunctionComponent<IterationViewProps> = props => {
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
