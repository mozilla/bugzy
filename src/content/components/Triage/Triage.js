import React from "react";
import styles from "./Triage.scss";
import {BugList} from "../BugList/BugList";
import {Loader} from "../Loader/Loader";

import {runQuery} from "../../lib/utils";
import {getAdjacentIteration} from "../../../common/iterationUtils";
import {BUGZILLA_TRIAGE_COMPONENTS} from "../../../config/project_settings";

const prevColumns = ["id", "summary", "assigned_to", "priority"];
const columns = ["id", "summary", "last_change_time"];

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
      component: BUGZILLA_TRIAGE_COMPONENTS,
      iteration: prevIteration.number,
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
    const needinfoBugs = this.state.bugs.filter(b => b.flags && b.flags.some(flag => flag.name === "needinfo"));
    const untriagedBugs = this.state.bugs.filter(b => !b.flags || b.flags.every(flag => flag.name !== "needinfo"));
    return {needinfoBugs, untriagedBugs};
  }
  renderContent() {
    const {needinfoBugs, untriagedBugs} = this.sortUntriagedBugs();
    return (<React.Fragment>
      <h1>Previous Iteration ({this.state.prevIteration})</h1>
      <BugList bulkEdit={true} tags bugs={this.state.prevIterationBugs} columns={prevColumns} />
      <h1>Untriaged Bugs</h1>
      <BugList bulkEdit={true} tags bugs={untriagedBugs} columns={columns} />
      <h1>Bugs with needinfo</h1>
      <BugList bulkEdit={true} tags bugs={needinfoBugs} columns={columns} />
    </React.Fragment>)
  }
  render() {
    return (<div className={styles.container}>
      {this.state.loaded ? this.renderContent() : <Loader />}
    </div>);
  }
}
