import React from "react";
import styles from "./Triage.scss";
import {BugList} from "../BugList/BugList";
import {Loader} from "../Loader/Loader";

import {runQuery} from "../../lib/utils";
import {getAdjacentIteration} from "../../../common/iterationUtils";
import {BUGZILLA_TRIAGE_COMPONENTS} from "../../../config/project_settings";

const POCKET_META = 1512725;

const prevColumns = ["id", "summary", "assigned_to", "priority", "blocks"];
const columns = ["id", "summary", "last_change_time", "blocks"];
const prevColumnsDisplay = ["id", "summary", "assigned_to", "priority"];
const columnsDisplay = ["id", "summary", "last_change_time"];

export class Triage extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {loaded: false, bugs: [], prevIteration: null};
  }

  async componentWillMount() {
    const prevIteration = getAdjacentIteration(-1);
    const {bugs: prevIterationBugs} = await runQuery({
      include_fields: prevColumns.concat(["whiteboard", "severity"]),
      resolution: "---",
      rules: [
        {key: "cf_fx_iteration", operator: "substring", value: prevIteration.number},
        {
          operator: "OR",
          rules: [
            {key: "blocked", operator: "anywordssubstr", value: this.props.metas.map(m => m.id).join(",")},
            {key: "component", operator: "anyexact", value: BUGZILLA_TRIAGE_COMPONENTS.join(",")}
          ]
        }
      ]
    });
    const {bugs} = await runQuery({
      include_fields: columns.concat(["whiteboard", "severity", "flags"]),
      resolution: "---",
      priority: "--",
      component: BUGZILLA_TRIAGE_COMPONENTS,
      keywords: "meta",
      keywords_type: "nowords",
      status_whiteboard: "blocked",
      status_whiteboard_type: "notregexp",
      order: "changeddate DESC"
    });
    this.setState({loaded: true, bugs, prevIterationBugs, prevIteration: prevIteration.number});
  }

  // Separate out bugs with needinfo, we don't want to triage them until the request is resolved
  sortUntriagedBugs() {
    const result = {
      needinfoBugs: [],
      pockedUntriagedBugs: [],
      untriagedBugs: [],
      previousIterationBugs: [],
      pocketPreviousIterationBugs: []
    };
    this.state.bugs.forEach(b => {
      if (b.flags && b.flags.some(flag => flag.name === "needinfo")) {
        result.needinfoBugs.push(b);
      } else if (b.blocks.includes(POCKET_META)) {
        result.pockedUntriagedBugs.push(b);
      } else {
        result.untriagedBugs.push(b);
      }
    });
    this.state.prevIterationBugs.forEach(b => {
      if (b.blocks.includes(POCKET_META)) {
        result.pocketPreviousIterationBugs.push(b);
      } else {
        result.previousIterationBugs.push(b);
      }
    });
    return result;
  }

  renderContent() {
    const {needinfoBugs, untriagedBugs, pocketUntriagedBugs, previousIterationBugs, pocketPreviousIterationBugs} = this.sortUntriagedBugs();
    return (<React.Fragment>
      <h1>Previous Iteration ({this.state.prevIteration})</h1>
      <BugList subtitle="Activity Stream" compact={true} showHeaderIfEmpty={true} bulkEdit={true} tags={true} bugs={previousIterationBugs} columns={prevColumnsDisplay} />
      <BugList subtitle="Pocket" compact={true} showHeaderIfEmpty={true} bulkEdit={true} tags={true} bugs={pocketPreviousIterationBugs} columns={prevColumnsDisplay} />
      <h1>Untriaged Bugs</h1>
      <BugList subtitle="Activity Stream" compact={true} showHeaderIfEmpty={true} bulkEdit={true} tags={true} bugs={untriagedBugs} columns={columnsDisplay} />
      <BugList subtitle="Pocket" compact={true} showHeaderIfEmpty={true} bulkEdit={true} tags={true} bugs={pocketUntriagedBugs} columns={columnsDisplay} />
      <h1>Bugs with needinfo</h1>
      <BugList compact={true} bulkEdit={true} tags={true} bugs={needinfoBugs} columns={columnsDisplay} />
    </React.Fragment>);
  }

  render() {
    return (<div className={styles.container}>
      {this.state.loaded ? this.renderContent() : <Loader />}
    </div>);
  }
}
