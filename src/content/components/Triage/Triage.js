import React from "react";
import { GlobalContext } from "../GlobalContext/GlobalContext";
import { BugList } from "../BugList/BugList";
import { MiniLoader } from "../Loader/Loader";
import { BUGZILLA_TRIAGE_COMPONENTS } from "../../../config/project_settings";
import { Container } from "../ui/Container/Container";

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
      prevIteration: null,
    };
    this.getBugWarning = this.getBugWarning.bind(this);
  }

  async componentWillMount() {
    this._isMounted = true;
    const prevIteration =
      this.context.iterations.getAdjacentIteration(-1).number;
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
      ({ rsp: [{ bugs: prevIterationBugs }, { bugs }], awaitingNetwork }) =>
        this.setState({
          loaded: true,
          awaitingNetwork,
          bugs,
          prevIterationBugs,
          prevIteration,
        })
    );
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  // Separate out bugs with needinfo, we don't want to triage them until the request is resolved
  sortUntriagedBugs() {
    const result = {
      needinfoBugs: [],
      previousIterationBugs: [],
      untriagedBugs: [],
    };
    this.state.bugs.forEach(b => {
      if (isNeedInfo(b)) {
        result.needinfoBugs.push(b);
      } else {
        result.untriagedBugs.push(b);
      }
    });
    result.previousIterationBugs = [...this.state.prevIterationBugs];
    return result;
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

  renderContent() {
    const { needinfoBugs, untriagedBugs, previousIterationBugs } =
      this.sortUntriagedBugs();
    return (
      <React.Fragment>
        <h3>Previous Iteration ({this.state.prevIteration})</h3>
        <BugList
          compact={true}
          showResolvedOption={false}
          showHeaderIfEmpty={true}
          bulkEdit={true}
          tags={true}
          bugs={previousIterationBugs}
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
          bugs={untriagedBugs}
          columns={columnsDisplay}
          getBugWarning={this.getBugWarning}
        />
        <h3>Bugs with needinfo</h3>
        <BugList
          compact={true}
          bulkEdit={true}
          showResolvedOption={false}
          tags={true}
          bugs={needinfoBugs}
          columns={columnsDisplay}
          getBugWarning={this.getBugWarning}
        />
        <MiniLoader hidden={!this.state.awaitingNetwork} />
      </React.Fragment>
    );
  }

  render() {
    return (
      <Container
        loaded={this.state.loaded}
        heading={"Triage"}
        render={() => this.renderContent()}
      />
    );
  }
}
