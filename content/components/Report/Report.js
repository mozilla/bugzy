import React from "react";
import styles from "./Report.scss";
import {runQuery, AS_COMPONENTS} from "../../lib/utils";

const DEFAULTS = {
  component: ["Activity Streams: Newtab", "New Tab Page", "Activity Streams: Application Servers"],
  include_fields: ["id","summary", "status", "assigned_to", "priority"]
};

export class Report extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {};
  }
  async componentDidMount() {
    const {bugs: currentIterationBugs} = await runQuery({
      include_fields: ["id", "status"],
      component: DEFAULTS.component,
      iteration: 60.4
    });
    this.setState({currentIterationBugs});
  }
  renderCurrentIterationStats(bugs) {
    if (!bugs || !bugs.length) return;
    return <React.Fragment>
      <tr><td>Total bugs</td><td>{bugs.length}</td></tr>
      <tr><td>Completed</td><td>{bugs.filter(b => b.status === "RESOLVED").length}</td></tr>
    </React.Fragment>
  }
  render() {
    const {prop, state} = this;
    return (<div className={styles.container}>
      <h2>Report</h2>
      <table className={styles.table}>
        <tbody>
        {this.renderCurrentIterationStats(state.currentIterationBugs)}
        </tbody>
      </table>
    </div>);
  }
}
