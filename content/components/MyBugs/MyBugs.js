import React from "react";
import styles from "./MyBugs.scss";
import gStyles from "../../styles/gStyles.scss";
import {BugList} from "../BugList/BugList";
import {runQuery, AS_COMPONENTS} from "../../lib/utils";
import {prefs} from "../../lib/prefs";
import {Loader} from "../Loader/Loader";

const columns = ["id", "summary", "last_change_time"];
const include_fields = columns.concat(["whiteboard", "keywords", "severity"]);

export class MyBugs extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      bugsAssigned: [],
      bugsFlags: [],
      bugsComments: [],
      loaded: false,
      email: null,
      emailWasChanged: false
    };
    this.onEmailChange = this.onEmailChange.bind(this);
    this.onEmailSubmit = this.onEmailSubmit.bind(this);
  }
  async refresh() {
    this.setState({loaded: false});
    const newState = {emailWasChanged: false, loaded: true};
    if (this.state.email) {
      newState.bugsAssigned = (await runQuery({
        include_fields,
        resolution: "---",
        order: "changeddate DESC",
        custom: {
          assigned_to: {equals: this.state.email}
        }
      })).bugs;
      newState.bugsFlags = (await runQuery({
        include_fields,
        resolution: "---",
        order: "changeddate DESC",
        custom : {
          "requestees.login_name": {equals: this.state.email}
        }
      })).bugs;
      newState.bugsComments = (await runQuery({
        include_fields,
        order: "changeddate DESC",
        limit: 30,
        custom : {
          "commenter": {equals: this.state.email}
        }
      })).bugs;
    }
    this.setState(newState);
  }
  componentWillMount() {
    const email = prefs.get("bugzilla_email");
    this.setState({email}, this.refresh);
  }
  onEmailChange(e) {
    this.setState({email: e.target.value, emailWasChanged: true});
  }
  onEmailSubmit(e) {
    prefs.set("bugzilla_email", this.state.email);
    this.refresh();
  }
  render() {
    return (<div className={styles.container}>
      <h1>My Bugs</h1>
      <p>
        <label>Bugzilla Email </label>
        <input
          className={gStyles.smallInput}
          type="text" value={this.state.email}
          onChange={this.onEmailChange} /> {(this.state.loaded && this.state.emailWasChanged) ? <button
            className={gStyles.primaryButton}
            onClick={this.onEmailSubmit}>Update</button> : null}
      </p>
      {this.state.loaded ? <div>
        <BugList tags={true} title="Flags" bulkEdit={true} bugs={this.state.bugsFlags} columns={columns} />
        <BugList tags={true} title="Assigned to me" bulkEdit={true} bugs={this.state.bugsAssigned} columns={columns} />
        <BugList tags={true} title="Recently commented on" bulkEdit={true} bugs={this.state.bugsComments} columns={columns} />
      </div> : <Loader />}
    </div>);
  }
}
