import React from "react";
import { GlobalContext } from "../GlobalContext/GlobalContext";
import { BugList } from "../BugList/BugList";
import { MiniLoader } from "../Loader/Loader";
import { BUGZILLA_TRIAGE_COMPONENTS } from "../../../config/project_settings";
import { Container } from "../ui/Container/Container";
import { DateTime } from "luxon";

const prevColumns = [
  "id",
  "summary",
  "assigned_to",
  "priority",
  "blocks",
  "component",
];
const columns = ["id", "summary", "last_change_time", "blocks", "component"];
const prevColumnsDisplay = ["id", "summary", "assigned_to", "priority"];
const columnsDisplay = ["id", "summary", "last_change_time"];

function isNeedInfo(bug) {
  return bug.flags && bug.flags.some(flag => flag.name === "needinfo");
}

export class Triage extends React.PureComponent {
  static contextType = GlobalContext;

  constructor(props) {
    super(props);
    this.state = {
      loaded: false,
      awaitingNetwork: false,
      bugs: [],
      needinfoBugs: [],
      untriagedBugs: [],
      previousIterationBugs: [],
      prevIteration: null,
      triageOwner: null,
    };
    this.getBugWarning = this.getBugWarning.bind(this);
  }

  async componentWillMount() {
    this._isMounted = true;
    const prevIteration =
      this.context.iterations.getAdjacentIteration(-1).number;
    this.setState({
      triageOwner: this.context.teams.omc.find(user => user.is_triage_owner),
    });
    await this.context.qm.runCachedQueries(
      [
        {
          include_fields: prevColumns.concat(["whiteboard", "type"]),
          resolution: "---",
          rules: [
            {
              key: "keywords",
              operator: "notequals",
              value: "github-merged",
            },
            {
              key: "cf_fx_iteration",
              operator: "substring",
              value: prevIteration,
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
          ],
        },
        {
          include_fields: columns.concat(["whiteboard", "type", "flags"]),
          resolution: "---",
          priority: "--",
          component: BUGZILLA_TRIAGE_COMPONENTS,
          order: "changeddate DESC",
          rules: [
            { key: "keywords", operator: "nowords", value: "meta" },
            {
              key: "status_whiteboard",
              operator: "notsubstring",
              value: "[blocked]",
            },
          ],
        },
      ],
      () => this._isMounted,
      ({
        rsp: [{ bugs: previousIterationBugs }, { bugs }],
        awaitingNetwork,
      }) => {
        let needinfoBugs = [];
        let untriagedBugs = [];
        for (let b of bugs) {
          if (isNeedInfo(b)) {
            needinfoBugs.push(b);
          } else {
            untriagedBugs.push(b);
          }
        }
        this.setState({
          loaded: true,
          awaitingNetwork,
          bugs,
          needinfoBugs,
          untriagedBugs,
          previousIterationBugs,
          prevIteration,
        });
      }
    );
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  getBugWarning(bug) {
    if (!this.context.metas.some(m => bug.blocks?.includes(m.id))) {
      return {
        type: "no-meta",
        message:
          "This bug is not blocking any meta bug in Messaging System. Please add a meta bug!",
      };
    }
    return {};
  }

  getSubHeading() {
    let { triageOwner } = this.state;
    if (!triageOwner) {
      return null;
    }
    let { real_name, nick, email } = triageOwner;
    let startDate = DateTime.utc()
      .set({
        weekday: 1,
        hour: 12,
        minute: 30,
        second: 0,
        millisecond: 0,
      })
      .toLocal();
    let endDate = startDate.plus({ days: 4 });
    let dateString = startDate.toLocaleString({
      month: "long",
      day: "numeric",
    });
    if (startDate.month !== endDate.month) {
      dateString += ` - ${endDate.toLocaleString({
        month: "long",
        day: "numeric",
      })}`;
    } else {
      dateString += `-${endDate.toLocaleString({ day: "numeric" })}`;
    }
    return (
      <span
        title="Triage ownership alternates every Monday at 12:30 UTC."
        style={{ cursor: "help", "text-decoration": "underline .05em dotted" }}>
        Owner: {nick || real_name || email} ({dateString})
      </span>
    );
  }

  render() {
    return (
      <Container
        loaded={this.state.loaded}
        heading={"Triage"}
        subHeading={this.getSubHeading()}>
        <h3>Previous Iteration ({this.state.prevIteration})</h3>
        <BugList
          compact={true}
          showResolvedOption={false}
          showHeaderIfEmpty={true}
          bulkEdit={true}
          tags={true}
          bugs={this.state.previousIterationBugs}
          columns={prevColumnsDisplay}
          getBugWarning={this.getBugWarning}
        />
        <h3>Untriaged Bugs</h3>
        <BugList
          compact={true}
          showResolvedOption={false}
          showHeaderIfEmpty={true}
          bulkEdit={true}
          tags={true}
          bugs={this.state.untriagedBugs}
          columns={columnsDisplay}
          getBugWarning={this.getBugWarning}
        />
        <h3>Bugs with needinfo</h3>
        <BugList
          compact={true}
          bulkEdit={true}
          showResolvedOption={false}
          tags={true}
          bugs={this.state.needinfoBugs}
          columns={columnsDisplay}
          getBugWarning={this.getBugWarning}
        />
        <MiniLoader hidden={!this.state.awaitingNetwork} />
      </Container>
    );
  }
}
