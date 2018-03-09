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
    if (!this.props.bugzilla_email) return;
    const bugs = await runQuery({
      include_fields: columns.concat("whiteboard),
      resolution: "---",
      order: "changeddate DESC",
      custom: {
        assigned_to: {equals: this.props.bugzilla_email}
      }
    });
    this.setState({bugs});
  }
  renderEmailMessage() {
    const email = this.props.bugzilla_email;
    return email ? <React.Fragment>Bugs asssigned to: <strong>{email}</strong></React.Fragment> : "Your email is not configured";
  }
  render() {
    return (<div className={styles.container}>
      <h1>My Bugs</h1>
      <p>{this.renderEmailMessage()} (<strong>⌘,</strong> to change preferences)</p>
      <BugList bugs={this.state.bugs} columns={columns} />
    </div>);
  }
}
