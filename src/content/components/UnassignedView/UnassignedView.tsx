import React from "react";
import { BugList } from "../BugList/BugList";
import { useBugFetcher, BugQuery } from "../../hooks/useBugFetcher";
import { Container } from "../ui/Container/Container";
import { Loader, MiniLoader } from "../Loader/Loader";

interface GetQueryOptions {
  iteration: string;
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
    let priorityComparison =
      a.priority && b.priority && a.priority.localeCompare(b.priority);
    if (priorityComparison) {
      return priorityComparison;
    }

    let iterationComparison = 0;
    if (a.cf_fx_iteration != b.cf_fx_iteration) {
      let aIteration = parseFloat(a.cf_fx_iteration);
      let bIteration = parseFloat(b.cf_fx_iteration);
      if (isNaN(aIteration)) {
        iterationComparison = Number(!isNaN(bIteration));
      } else if (isNaN(bIteration)) {
        iterationComparison = -1;
      } else {
        iterationComparison = aIteration - bIteration;
      }
    }

    return (
      iterationComparison ||
      Date.parse(b.last_change_time) - Date.parse(a.last_change_time)
    );
  });
}

interface UnassignedViewProps {
  /* e.g. "65.4" */
  iteration: string;
}

export const UnassignedView: React.FunctionComponent<UnassignedViewProps> = props => {
  const components = ["Messaging System"];
  const query = getQuery({ components, ...props });
  const state = useBugFetcher({
    query,
    updateOn: [],
  });

  const sortedBugs = sortBugs(state.bugs);
  const isLoaded = state.status === "loaded";

  return (
    <Container loaded={true} heading={"Unassigned P1/P2 Bugs"}>
      {isLoaded && (
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
      )}
      {!isLoaded && <Loader />}
    </Container>
  );
};
