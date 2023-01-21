import React from "react";
import { BugList } from "../BugList/BugList";
import { useBugFetcher, BugQuery } from "../../hooks/useBugFetcher";
import { Container } from "../ui/Container/Container";
import { Loader, MiniLoader } from "../Loader/Loader";
import { columnTransforms as cTrans } from "../BugList/columnTransforms";

interface GetQueryOptions {
  iteration: string;
  metas: Array<{
    id: string;
    component: string;
    priority?: string;
    displayName?: string;
  }>;
  components: string[];
}

const COLUMNS = [
  "id",
  "type",
  "summary",
  "assigned_to",
  "priority",
  "cf_fx_iteration",
  "last_change_time",
];

const getQuery = (options: GetQueryOptions): BugQuery => ({
  include_fields: [
    "id",
    "summary",
    "assigned_to",
    "priority",
    "status",
    "keywords",
    "type",
    "component",
    "cf_fx_iteration",
    "last_change_time",
  ],
  rules: [
    {
      key: "cf_fx_iteration",
      operator: "substring",
      value: options.iteration,
    },
    {
      key: "component",
      operator: "anyexact",
      value: options.components.join(","),
    },
    {
      operator: "OR",
      rules: [
        {
          key: "priority",
          operator: "equals",
          value: "P1",
        },
        {
          key: "priority",
          operator: "equals",
          value: "P2",
        },
      ],
    },
    {
      rules: [
        {
          key: "assigned_to",
          operator: "equals",
          value: "nobody@mozilla.org",
        },
      ],
    },
    { key: "keywords", operator: "notsubstring", value: "meta" },
  ],
});

function sortBugs(bugs: any[]): any[] {
  return bugs.sort((a, b) => {
    let aIteration = cTrans.cf_fx_iteration(a.cf_fx_iteration);
    let bIteration = cTrans.cf_fx_iteration(b.cf_fx_iteration);

    let iterationComparison = 0;

    if (aIteration != bIteration) {
      if (aIteration === "--") {
        iterationComparison = 1;
      } else if (bIteration === "--") {
        iterationComparison = -1;
      } else if (parseFloat(aIteration) < parseFloat(bIteration)) {
        iterationComparison = -1;
      } else if (parseFloat(aIteration) > parseFloat(bIteration)) {
        iterationComparison = 1;
      }
    }

    return (
      a.priority.localeCompare(b.priority) ||
      iterationComparison ||
      Date.parse(b.last_change_time) - Date.parse(a.last_change_time)
    );
  });
}

interface NextReleaseViewProps {
  /* e.g. "65.4" */
  iteration: string;
  /* Metas for all bugzy stuff */
  metas: Array<{
    id: string;
    component: string;
    priority?: string;
    displayName?: string;
  }>;
  match: { url: string };
}

interface NextReleaseViewTabProps extends NextReleaseViewProps {
  components: string[];
}

const NextReleaseViewTab: React.FunctionComponent<NextReleaseViewTabProps> = props => {
  const query = getQuery(props);
  const state = useBugFetcher({
    query,
    updateOn: [],
  });

  const sortedBugs = sortBugs(state.bugs);
  const isLoaded = state.status === "loaded";

  return isLoaded ? (
    <React.Fragment>
      <div style={{ marginTop: "20px" }}>
        <BugList
          key={0}
          compact={true}
          subtitle={"Messaging System Unassigned P1/P2"}
          tags={true}
          bulkEdit={true}
          showHeaderIfEmpty={false}
          bugs={sortedBugs}
          columns={COLUMNS}
          showResolved={false}
          showResolvedOption={false}
          visibleIfEmpty={false}
        />
      </div>
      <MiniLoader hidden={!state.awaitingNetwork} />
    </React.Fragment>
  ) : (
    <Loader />
  );
};

export const NextReleaseView: React.FunctionComponent<NextReleaseViewProps> = props => {
  return (
    <Container loaded={true} heading={["Next Release"]}>
      <NextReleaseViewTab
        {...props}
        metas={props.metas}
        components={["Messaging System"]}
      />
    </Container>
  );
};
