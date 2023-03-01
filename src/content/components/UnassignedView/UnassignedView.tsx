import React from "react";
import { GlobalContext } from "../GlobalContext/GlobalContext";
import { BugList } from "../BugList/BugList";
import { useBugFetcher } from "../../hooks/useBugFetcher";
import { BugQuery } from "../../hooks/useBugFetcherTypes";
import { Container } from "../ui/Container/Container";
import { Loader, MiniLoader } from "../Loader/Loader";

const COLUMNS = [
  "id",
  "type",
  "summary",
  "assigned_to",
  "priority",
  "cf_fx_iteration",
  "last_change_time",
];

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

export const UnassignedView: React.FunctionComponent = () => {
  const { qm } = React.useContext(GlobalContext);
  const query = React.useMemo(
    (): BugQuery => ({
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
          key: "component",
          operator: "anyexact",
          value: "Messaging System",
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
    }),
    []
  );
  const state = useBugFetcher({ query, qm });

  const sortedBugs = sortBugs(state.bugs);
  const isLoaded = state.status === "loaded";

  return (
    <Container
      loaded={true}
      heading={"Unassigned P1/P2 Bugs"}
      subHeading={
        <React.Fragment>
          This list includes unassigned P1 and P2 bugs in Messaging System {"("}
          <a
            href={`https://bugzilla.mozilla.org/buglist.cgi?cmdtype=dorem&remaction=run&namedcmd=Messaging%20System%20Unassigned%20P1%2FP2&sharer_id=125983&list_id=16386089`}>
            query
          </a>
          {")"}
        </React.Fragment>
      }>
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
