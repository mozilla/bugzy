import React from "react";
import * as styles from "./AllocationView.module.scss";
import { GlobalContext } from "../GlobalContext/GlobalContext";
import { BugList } from "../BugList/BugList";
import { MiniLoader } from "../Loader/Loader";
import { Container } from "../ui/Container/Container";
import { BUGZILLA_TRIAGE_COMPONENTS } from "../../../config/project_settings";
import { teams } from "../../../config/people";
import { columnTransforms } from "../BugList/columnTransforms";
import { prefs } from "../../lib/prefs";
import * as priorityGuideStyles from "../PriorityGuide/PriorityGuide.module.scss";

const displayColumns = [
  "ticket",
  "id",
  "type",
  "summary",
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

// sort bugs with "see also" fields first.
function compareTicket(a, b) {
  if (a === b) return 0;
  if (a === "") return 1;
  if (b === "") return -1;
  return 0;
}

// sort bugs by points, descending.
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

// sort bugs by priority, P1 to P5, then null.
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

export class AllocationView extends React.PureComponent {
  static contextType = GlobalContext;

  constructor(props) {
    super(props);
    this.state = {
      loaded: false,
      awaitingNetwork: false,
      bugsByEngineer: [],
      showUnsized: false,
    };
    this.onCheckShowUnsized = this.onCheckShowUnsized.bind(this);
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
              operator: "notequals",
              value: "---",
            },
          ],
        },
      ],
      () => this._isMounted,
      ({ rsp: [{ bugs }], awaitingNetwork }) => {
        let bugsByEngineer = [];
        // put engineers in the alphabetic order they appear in the config, but
        // put the viewer first if they've set their bugzilla email in
        // SettingsView or MyBugs to an OMC engineer email.
        const email = prefs.get("bugzilla_email");
        if (email && teams.omc.includes(email)) {
          bugsByEngineer.push({
            engineer: email,
            bugs: [],
            user: this.context.teams.omc.find(e =>
              [e.name, e.email].includes(email)
            ),
          });
        }
        for (const engineer of teams.omc) {
          if (engineer === email) {
            continue;
          }
          let item = {
            engineer,
            bugs: [],
            user: this.context.teams.omc.find(e =>
              [e.name, e.email].includes(engineer)
            ),
          };
          bugsByEngineer.push(item);
        }

        for (const bug of bugs) {
          let item = bugsByEngineer.find(e => e.engineer === bug.assigned_to);
          if (!item) {
            continue;
          }

          // only add the bug if it matches the current or last release.
          const bugRelease = bug.cf_fx_iteration.split(".")[0];
          if (
            parseInt(bugRelease, 10) > this.props.release ||
            parseInt(bugRelease, 10) < this.props.release - 1
          ) {
            continue;
          }

          // find the ticket from the See Also field, if it exists.
          let ticket = "";
          if (bug.see_also) {
            for (const url of bug.see_also) {
              let match = url.match(
                /mozilla-hub.atlassian.net\/browse\/((?:OMC|FXE)-\d+)/
              );
              if (match) {
                ticket = match[1];
                break;
              }
            }
          }
          bug.ticket = ticket;
          item.bugs.push(bug);
        }

        bugsByEngineer.forEach((item, index) => {
          // if there are no bugs for this engineer, remove them from the list
          if (!item.bugs.length) {
            bugsByEngineer.splice(index, 1);
            return;
          }
          // sort bugs by see also field, then points, then by priority
          item.bugs.sort(
            (a, b) =>
              compareTicket(a.ticket, b.ticket) ||
              comparePoints(a.cf_fx_points, b.cf_fx_points) ||
              comparePriority(a.priority, b.priority)
          );
        });

        this.setState({
          loaded: true,
          awaitingNetwork,
          bugsByEngineer,
        });
      }
    );
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  onCheckShowUnsized(e) {
    this.setState({ showUnsized: e.target.checked });
  }

  filterUnsized(bugs) {
    if (this.state.showUnsized) {
      return bugs;
    }
    return bugs.filter(bug => columnTransforms.cf_fx_points(bug.cf_fx_points));
  }

  render() {
    return (
      <Container
        loaded={this.state.loaded}
        heading={"Engineering Allocation"}
        subHeading={
          <React.Fragment>
            This list includes unresolved, sized bugs OMC engineers are working
            on for the current release.
          </React.Fragment>
        }>
        <div className={styles.detailsHeading}>
          <details>
            <summary>
              <span className={styles.summaryLabel}>
                How to add bugs to this list
              </span>
              <span className={styles.spacer} />
              <label>
                <input
                  type="checkbox"
                  onChange={this.onCheckShowUnsized}
                  checked={this.state.showUnsized}
                />{" "}
                Show unsized bugs
              </label>
            </summary>
            <ol>
              <li>
                Add the Jira ticket URL to the bug&apos;s <code>See Also</code>{" "}
                field.
              </li>
              <li>
                Add the <code>[omc]</code> tag to the bug&apos;s{" "}
                <code>Whiteboard</code> field. If the ticket has multiple child
                bugs, skip this step. Adding this tag will cause the bug to be
                synced with the ticket, which you may not want if the ticket
                tracks multiple bugs.
              </li>
              <li>
                Set the bug&apos;s <code>Points</code> field to the approximate
                number of days required to complete the bug. See the{" "}
                <button
                  className={priorityGuideStyles.legendButton}
                  onClick={() => prefs.set("priority_guide_open", true)}>
                  Legend
                </button>{" "}
                for more information.
              </li>
              <li>
                Please also add the Bugzilla link to the Jira ticket. Click the
                arrow button next to <code>Link Issue</code> and select{" "}
                <code>Web Link</code>.
              </li>
            </ol>
          </details>
        </div>
        {this.state.bugsByEngineer.map(({ engineer, bugs, user }) => {
          return (
            <BugList
              key={engineer}
              title={user?.real_name || engineer}
              subtitle={
                <a
                  href={`https://bugzilla.mozilla.org/user_profile?user_id=${user?.id}`}>
                  {engineer}
                </a>
              }
              compact={true}
              showResolvedOption={false}
              visibleIfEmpty={false}
              bulkEdit={false}
              points={true}
              tickets={true}
              tags={false}
              bugs={this.filterUnsized(bugs)}
              columns={displayColumns}
            />
          );
        })}
        <MiniLoader hidden={!this.state.awaitingNetwork} />
      </Container>
    );
  }
}
