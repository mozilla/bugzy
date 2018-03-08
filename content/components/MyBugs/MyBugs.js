import React from "react";
import styles from "./MyBugs.scss";
import {BugList} from "../BugList/BugList";
import {runQuery, AS_COMPONENTS} from "../../lib/utils";

const columns = ["id", "summary", "last_change_time", "cf_fx_iteration"];

export class MyBugs extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {bugs: []};
  }
  async componentWillMount() {
    const bugs = await runQuery({
      include_fields: columns,
      resolution: "---",
      order: "changeddate DESC",
      custom: {
        assigned_to: {equals: "khudson@mozilla.com"}
      }
    });
    this.setState({bugs});
  }
  render() {
    return (<div className={styles.container}>
      <h1>My Bugs</h1>
      <BugList bugs={this.state.bugs} columns={columns} />
    </div>);
  }
}
