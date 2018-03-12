import React from "react";
import styles from "./MessageCenter.scss";
import {BugList} from "../BugList/BugList";
import {runQuery, AS_COMPONENTS} from "../../lib/utils";

const displayColumns = [
  "id",
  "summary",
  "cf_fx_iteration",
  "target_milestone"
];
const allColumns = displayColumns.concat([
  "status",
  "last_change_time",
]);
const META_BUG_ID = 1432588;

export class MessageCenter extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {bugs: []};
  }
  sortByRelease(bugs) {
    const result = {r60: [], r61: [], backlog: []};
    for (const bug of bugs) {
      if (bug.target_milestone.match("60")) {
        result.r60.push(bug);
      } else if (bug.target_milestone.match("61")) {
        result.r61.push(bug);
      } else {
        result.backlog.push(bug);
      }
    }
    return result;
  }
  async componentWillMount() {
    const bugs = await runQuery({
      include_fields: allColumns,
      // resolution: "---",
      // order: "changeddate DESC",
      custom: {
        blocked: META_BUG_ID,
      }
    });
    this.setState({bugs});
  }
  render() {
    const bugsByRelease = this.sortByRelease(this.state.bugs);
    return (<div className={styles.container}>
      <h1>Message Center</h1>
      <h3>Firefox 60</h3>
      <BugList bulkEdit={true} bugs={bugsByRelease.r60} columns={displayColumns} />
      <h3>Firefox 61</h3>
      <BugList bulkEdit={true} bugs={bugsByRelease.r61} columns={displayColumns} />
      <h3>Backlog</h3>
      <BugList bulkEdit={true} bugs={bugsByRelease.backlog} columns={displayColumns} />
    </div>);
  }
}
