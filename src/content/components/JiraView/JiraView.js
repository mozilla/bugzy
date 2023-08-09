import React from "react";
import { GlobalContext } from "../GlobalContext/GlobalContext";
import { BugList } from "../BugList/BugList";
import { Loader, MiniLoader } from "../Loader/Loader";
import { Container } from "../ui/Container/Container";
import { BUGZILLA_TRIAGE_COMPONENTS } from "../../../config/project_settings";
import { teams } from "../../../config/people";

// Add a view that includes an individual BugList for each OMC engineer,
// tracking all unresolved bugs in our components that are assigned to that
// engineer, have an iteration matching the current release, and have the points
// field set. Display columns should include ticket, bug id, type, title,
// iteration, priority, and points, in that order. Bugs should be sorted by
// points first, then by priority. In other words, 7-pointers go before
// 3-pointers, but if there are two 7-pointers, then the P1 should go before the
// P2.

const displayColumns = [
  "id",
  "type",
  "summary",
  "assigned_to",
  "cf_fx_iteration",
  "priority",
  "cf_fx_points",
];

const includeFields = [
  "id",
  "type",
  "summary",
  "cf_fx_iteration",
  "priority",
  "cf_fx_points",
  "assigned_to",
  "status",
  "component",
  "blocks",
  "flags",
  "keywords",
  "see_also",
  "whiteboard",
];

function comparePoints(a, b) {
  let computedPointsA = parseInt(a, 10);
  let computedPointsB = parseInt(b, 10);
  if (isNaN(computedPointsA)) {
    computedPointsA = 0;
  }
  if (isNaN(computedPointsB)) {
    computedPointsB = 0;
  }
  return computedPointsB - computedPointsA;
}

function comparePriority(a, b) {
  let computedPriorityA = a;
  let computedPriorityB = b;
  if (!a.startsWith("P")) {
    computedPriorityA = "P6";
  }
  if (!b.startsWith("P")) {
    computedPriorityB = "P6";
  }
  return computedPriorityA.localeCompare(computedPriorityB);
}

export class JiraView extends React.PureComponent {
  static contextType = GlobalContext;

  constructor(props) {
    super(props);
    this.state = {
      loaded: false,
      awaitingNetwork: false,
      bugsByEngineer: {},
      showUnsized: false,
    };
  }

  async componentWillMount() {
    this._isMounted = true;
    await this.context.qm.runCachedQueries(
      [
        {
          include_fields: includeFields,
          resolution: "---",
          order: "cf_fx_points DESC, priority, changeddate DESC",
          rules: [
            {
              key: "assigned_to",
              operator: "anyexact",
              value: teams.omc.join(","),
            },
            {
              operator: "OR",
              rules: [
                {
                  key: "blocked",
                  operator: "anywordssubstr",
                  value: this.context.metas.map(m => m.id).join(","),
                },
                {
                  key: "component",
                  operator: "anyexact",
                  value: BUGZILLA_TRIAGE_COMPONENTS.join(","),
                },
              ],
            },
            {
              key: "cf_fx_iteration",
              operator: "substring",
              value: this.props.release,
            },
          ],
        },
      ],
      () => this._isMounted,
      ({ rsp: [{ bugs }], awaitingNetwork }) => {
        let tickets = {};
        for (let bug of bugs) {
          if (bug.see_also) {
            for (const url of bug.see_also) {
              let ticket = url.match(
                /mozilla-hub.atlassian.net\/browse\/(OMC-\d+)/
              );
              if (ticket) {
                tickets[ticket[1]] = tickets[ticket[1]] || [];
                tickets[ticket[1]].push(bug);
              }
            }
          }
        }

        for (const ticket in tickets) {
          // if there are no bugs for this engineer, remove them from the list
          if (!tickets[ticket].length) {
            delete tickets[ticket];
            continue;
          }
          // sort bugs by points first, then by priority
          tickets[ticket].sort(
            (a, b) =>
              comparePoints(a.cf_fx_points, b.cf_fx_points) ||
              comparePriority(a.priority, b.priority)
          );
        }
        this.setState({
          loaded: true,
          awaitingNetwork,
          tickets,
        });
      }
    );
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  render() {
    return (
      <Container
        loaded={true}
        heading={"Jira Tickets"}
        subHeading={
          <React.Fragment>
            This list includes unresolved, sized bugs that are assigned to a
            Jira ticket.
          </React.Fragment>
        }>
        {this.state.loaded ? (
          <React.Fragment>
            {Object.entries(this.state.tickets).map(([ticket, bugs]) => {
              return (
                <BugList
                  key={ticket}
                  title={
                    <a
                      href={`https://mozilla-hub.atlassian.net/browse/${ticket}`}>
                      {ticket}
                    </a>
                  }
                  compact={true}
                  showResolvedOption={false}
                  visibleIfEmpty={false}
                  bulkEdit={true}
                  points={true}
                  tickets={false}
                  tags={true}
                  bugs={bugs}
                  columns={displayColumns}
                />
              );
            })}
            <MiniLoader hidden={!this.state.awaitingNetwork} />
          </React.Fragment>
        ) : (
          <Loader />
        )}
      </Container>
    );
  }
}
