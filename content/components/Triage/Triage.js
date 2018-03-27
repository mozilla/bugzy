import React from "react";
import styles from "./Triage.scss";
import {BugList} from "../BugList/BugList";
import {runQuery, AS_COMPONENTS} from "../../lib/utils";
import {getPreviousIteration} from "../../../lib/iterationUtils";

const prevColumns = ["id", "summary", "assigned_to", "priority"];
const columns = ["id", "summary", "last_change_time"];

export class Triage extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {bugs: [], prevIteration: null};
  }
  async componentWillMount() {
    const prevIteration = getPreviousIteration();
    const {bugs: prevIterationBugs} = await runQuery({
      include_fields: prevColumns.concat(["whiteboard", "severity"]),
      resolution: "---",
      component: ["Activity Streams: Newtab", "Activity Streams: Application Servers"],
      iteration: prevIteration.number,
    });
    const {bugs} = await runQuery({
      include_fields: columns.concat(["whiteboard", "severity"]),
      resolution: "---",
      priority: "--",
      component: ["Activity Streams: Newtab", "Activity Streams: Application Servers"],
      keywords: "meta",
      keywords_type: "nowords",
      status_whiteboard: "blocked",
      status_whiteboard_type: "notregexp",
      order: "changeddate DESC"
    });
    this.setState({bugs, prevIterationBugs, prevIteration: prevIteration.number});
  }
  render() {
    return (<div className={styles.container}>
      <h1>Previous Iteration ({this.state.prevIteration})</h1>
      <BugList bulkEdit={true} tags bugs={this.state.prevIterationBugs} columns={prevColumns} />
      <h1>Untriaged Bugs</h1>
      <BugList bulkEdit={true} tags bugs={this.state.bugs} columns={columns} />
    </div>);
  }
}
