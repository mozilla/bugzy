import React from "react";
import * as styles from "./Triage.module.scss";
import { GlobalContext } from "../GlobalContext/GlobalContext";
import { BugList } from "../BugList/BugList";
import { Loader, MiniLoader } from "../Loader/Loader";
import { BUGZILLA_TRIAGE_COMPONENTS } from "../../../config/project_settings";
import { Tabs } from "../ui/Tabs/Tabs";

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

function isInPocketComponent(bug) {
  return bug.component === "Pocket";
}

function isInNewTabComponent(bug) {
  return bug.component === "New Tab Page";
}

function isInNimbusComponent(bug) {
  return bug.component === "Nimbus Desktop Client";
}

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
      nimbusNeedInfo: [],
      nimbusPrevious: [],
      nimbusUntriaged: [],
      pockedNeedinfoBugs: [],
      pocketPreviousIterationBugs: [],
      pocketUntriagedBugs: [],
      newtabNeedinfoBugs: [],
      newtabPreviousIterationBugs: [],
      newtabUntriagedBugs: [],
      previousIterationBugs: [],
      untriagedBugs: [],
    };
    this.state.bugs.forEach(b => {
      if (isInPocketComponent(b)) {
        if (isNeedInfo(b)) {
          result.pockedNeedinfoBugs.push(b);
        } else {
          result.pocketUntriagedBugs.push(b);
        }
      } else if (isInNewTabComponent(b)) {
        if (isNeedInfo(b)) {
          result.newtabNeedinfoBugs.push(b);
        } else {
          result.newtabUntriagedBugs.push(b);
        }
      } else if (isInNimbusComponent(b)) {
        if (isNeedInfo(b)) {
          result.nimbusNeedInfo.push(b);
        } else {
          result.nimbusUntriaged.push(b);
        }
      } else if (isNeedInfo(b)) {
        result.needinfoBugs.push(b);
      } else {
        result.untriagedBugs.push(b);
      }
    });
    this.state.prevIterationBugs.forEach(b => {
      if (isInPocketComponent(b)) {
        result.pocketPreviousIterationBugs.push(b);
      } else if (isInNimbusComponent(b)) {
        result.nimbusPrevious.push(b);
      } else if (isInNewTabComponent(b)) {
        result.newtabPreviousIterationBugs.push(b);
      } else {
        result.previousIterationBugs.push(b);
      }
    });
    return result;
  }

  renderContent() {
    const {
      needinfoBugs,
      untriagedBugs,
      pockedNeedinfoBugs,
      pocketUntriagedBugs,
      previousIterationBugs,
      pocketPreviousIterationBugs,
      newtabNeedInfoBugs,
      newtabPreviousIterationBugs,
      newtabUntriagedBugs,
      nimbusUntriaged,
      nimbusPrevious,
      nimbusNeedInfo,
    } = this.sortUntriagedBugs();
    return (
      <React.Fragment>
        <h1>Triage</h1>
        <Tabs
          noTopPadding={true}
          baseUrl={this.props.match.url}
          config={[
            {
              path: "",
              label: "User Journey",
              render: props => (
                <React.Fragment>
                  <h3>Previous Iteration ({this.state.prevIteration})</h3>
                  <BugList
                    {...props}
                    compact={true}
                    showResolvedOption={false}
                    showHeaderIfEmpty={true}
                    bulkEdit={true}
                    tags={true}
                    bugs={previousIterationBugs}
                    columns={prevColumnsDisplay}
                  />
                  <h3>Untriaged Bugs</h3>
                  <BugList
                    {...props}
                    compact={true}
                    showResolvedOption={false}
                    showHeaderIfEmpty={true}
                    bulkEdit={true}
                    tags={true}
                    bugs={untriagedBugs}
                    columns={columnsDisplay}
                  />
                  <h3>Bugs with needinfo</h3>
                  <BugList
                    compact={true}
                    bulkEdit={true}
                    showResolvedOption={false}
                    tags={true}
                    bugs={needinfoBugs}
                    columns={columnsDisplay}
                  />
                </React.Fragment>
              ),
            },
            {
              path: "/new-tab",
              label: "New Tab",
              render: props => (
                <React.Fragment>
                  <h3>Previous Iteration ({this.state.prevIteration})</h3>
                  <BugList
                    {...props}
                    compact={true}
                    showResolvedOption={false}
                    showHeaderIfEmpty={true}
                    bulkEdit={true}
                    tags={true}
                    bugs={newtabPreviousIterationBugs}
                    columns={prevColumnsDisplay}
                  />
                  <h3>Untriaged Bugs</h3>
                  <BugList
                    {...props}
                    compact={true}
                    showResolvedOption={false}
                    showHeaderIfEmpty={true}
                    bulkEdit={true}
                    tags={true}
                    bugs={newtabUntriagedBugs}
                    columns={columnsDisplay}
                  />
                  <h3>Bugs with needinfo</h3>
                  <BugList
                    compact={true}
                    bulkEdit={true}
                    showResolvedOption={false}
                    tags={true}
                    bugs={newtabNeedInfoBugs}
                    columns={columnsDisplay}
                  />
                </React.Fragment>
              ),
            },
            {
              path: "/pocket",
              label: "Pocket",
              render: props => (
                <React.Fragment>
                  <h3>Previous Iteration ({this.state.prevIteration})</h3>
                  <BugList
                    {...props}
                    compact={true}
                    showResolvedOption={false}
                    showHeaderIfEmpty={true}
                    bulkEdit={true}
                    tags={true}
                    bugs={pocketPreviousIterationBugs}
                    columns={prevColumnsDisplay}
                  />
                  <h3>Untriaged Bugs</h3>
                  <BugList
                    {...props}
                    compact={true}
                    showResolvedOption={false}
                    showHeaderIfEmpty={true}
                    bulkEdit={true}
                    tags={true}
                    bugs={pocketUntriagedBugs}
                    columns={columnsDisplay}
                  />
                  <h3>Bugs with needinfo</h3>
                  <BugList
                    compact={true}
                    bulkEdit={true}
                    showResolvedOption={false}
                    tags={true}
                    bugs={pockedNeedinfoBugs}
                    columns={columnsDisplay}
                  />
                </React.Fragment>
              ),
            },
            {
              path: "/nimbus",
              label: "Nimbus",
              render: props => (
                <React.Fragment>
                  <h3>Previous Iteration ({this.state.prevIteration})</h3>
                  <BugList
                    {...props}
                    compact={true}
                    showResolvedOption={false}
                    showHeaderIfEmpty={true}
                    bulkEdit={true}
                    tags={true}
                    bugs={nimbusPrevious}
                    columns={prevColumnsDisplay}
                  />
                  <h3>Untriaged Bugs</h3>
                  <BugList
                    {...props}
                    compact={true}
                    showResolvedOption={false}
                    showHeaderIfEmpty={true}
                    bulkEdit={true}
                    tags={true}
                    bugs={nimbusUntriaged}
                    columns={columnsDisplay}
                  />
                  <h3>Bugs with needinfo</h3>
                  <BugList
                    compact={true}
                    bulkEdit={true}
                    showResolvedOption={false}
                    tags={true}
                    bugs={nimbusNeedInfo}
                    columns={columnsDisplay}
                  />
                </React.Fragment>
              ),
            },
          ]}
        />
        <MiniLoader hidden={!this.state.awaitingNetwork} />
      </React.Fragment>
    );
  }

  render() {
    return (
      <div className={styles.container}>
        {this.state.loaded ? this.renderContent() : <Loader />}
      </div>
    );
  }
}
