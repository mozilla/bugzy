import React from "react";
import { GlobalContext } from "../GlobalContext/GlobalContext";
import { BugList } from "../BugList/BugList";
import { MiniLoader } from "../Loader/Loader";
import { Container } from "../ui/Container/Container";
import { BUGZILLA_TRIAGE_COMPONENTS } from "../../../config/project_settings";

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
            { key: "keywords", operator: "notsubstring", value: "meta" },
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
              operator: "notequals",
              value: "---",
            },
            {
              key: "see_also",
              operator: "substring",
              value: "mozilla-hub.atlassian.net/browse/OMC-",
            },
          ],
        },
      ],
      () => this._isMounted,
      ({ rsp: [{ bugs }], awaitingNetwork }) => {
        let allJiraTickets = {};
        for (let bug of bugs) {
          // take bugs from the current release
          const bugRelease = bug.cf_fx_iteration.split(".")[0];
          if (
            parseInt(bugRelease, 10) > this.props.release ||
            parseInt(bugRelease, 10) < this.props.release - 1
          ) {
            continue;
          }
          if (bug.see_also) {
            for (const url of bug.see_also) {
              let ticket = url.match(
                /mozilla-hub.atlassian.net\/browse\/(OMC-\d+)/
              );
              if (ticket) {
                let jiraTicket = ticket[1];
                bug.ticket = jiraTicket;
                allJiraTickets[jiraTicket] = allJiraTickets[jiraTicket] || [];
                allJiraTickets[jiraTicket].push(bug);
              }
            }
          }
        }

        for (const ticket of Object.keys(allJiraTickets)) {
          // sort bugs by points first, then by priority
          allJiraTickets[ticket].sort(
            (a, b) =>
              comparePoints(a.cf_fx_points, b.cf_fx_points) ||
              comparePriority(a.priority, b.priority)
          );
        }
        this.setState({
          loaded: true,
          awaitingNetwork,
          allJiraTickets,
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
        loaded={this.state.loaded}
        heading={"Jira Tickets"}
        subHeading="This list includes unresolved bugs linked to an OMC Jira ticket.">
        {Object.entries(this.state.allJiraTickets).map(([jiraTicket, bugs]) => {
          return (
            <BugList
              key={jiraTicket}
              title={
                <a
                  href={`https://mozilla-hub.atlassian.net/browse/${jiraTicket}`}>
                  {jiraTicket}
                </a>
              }
              compact={true}
              showResolvedOption={false}
              visibleIfEmpty={false}
              bulkEdit={true}
              points={true}
              tickets={false}
              tags={false}
              bugs={bugs}
              columns={displayColumns}
            />
          );
        })}
        <MiniLoader hidden={!this.state.awaitingNetwork} />
      </Container>
    );
  }
}
