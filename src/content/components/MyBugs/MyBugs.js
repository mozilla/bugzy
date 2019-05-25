import React from "react";
import styles from "./MyBugs.scss";
import gStyles from "../../styles/gStyles.scss";
import {BugList} from "../BugList/BugList";
import {runQuery} from "../../lib/utils";
import {prefs} from "../../lib/prefs";
import {Loader} from "../Loader/Loader";

const columns = ["id", "summary", "last_change_time", "cf_fx_iteration"];
const include_fields = columns.concat(["whiteboard", "keywords", "type", "status", "flags"]);

export class MyBugs extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      bugsAssigned: [],
      bugsFlags: [],
      bugsComments: [],
      loaded: false,
      email: null,
      showSettings: false,
      emailWasChanged: false,
    };
    this.onEmailChange = this.onEmailChange.bind(this);
    this.onEmailSubmit = this.onEmailSubmit.bind(this);
    this.toggleSettings = this.toggleSettings.bind(this);
  }

  async refresh() {
    this.setState({loaded: false});
    const newState = {emailWasChanged: false, loaded: true};
    if (this.state.email) {
      newState.bugsAssigned = (await runQuery({
        include_fields,
        resolution: "---",
        order: "changeddate DESC",
        custom: {assigned_to: {equals: this.state.email}},
      })).bugs;
      newState.bugsFlags = (await runQuery({
        include_fields,
        resolution: "---",
        order: "changeddate DESC",
        custom: {"requestees.login_name": {equals: this.state.email}},
      })).bugs;
      newState.bugsComments = (await runQuery({
        include_fields,
        order: "changeddate DESC",
        limit: 30,
        custom: {commenter: {equals: this.state.email}},
      })).bugs;
    }
    this.setState(newState);
  }

  componentWillMount() {
    const email = prefs.get("bugzilla_email");
    this.setState({email, showSettings: !email}, this.refresh);
  }

  onEmailChange(e) {
    this.setState({email: e.target.value, emailWasChanged: true});
  }

  onEmailSubmit(e) {
    prefs.set("bugzilla_email", this.state.email);
    this.refresh();
  }

  toggleSettings() {
    this.setState(state => ({showSettings: !state.showSettings}));
  }

  render() {
    return (
      <div className={styles.container}>
        <h1>
          My Bugs{" "}
          <button onClick={this.toggleSettings} className={styles.settingsBtn} title="settings" />
        </h1>
        <p hidden={!this.state.showSettings} className={styles.settingSection}>
          <label>Bugzilla Email </label>
          <input
            className={gStyles.smallInput}
            type="text"
            value={this.state.email}
            onChange={this.onEmailChange}
          />
          {this.state.loaded && this.state.emailWasChanged ? (
            <button className={gStyles.primaryButton} onClick={this.onEmailSubmit}>
              Save
            </button>
          ) : null}
        </p>
        <div className={styles.wrapper}>
          <div className={styles.mainColumn}>
            {this.state.loaded ? (
              <React.Fragment>
                <BugList
                  showSummaryBar={false}
                  title="Assigned to me"
                  bugs={this.state.bugsAssigned}
                  columns={columns}
                />
                <BugList
                  showSummaryBar={false}
                  title="Recently commented on"
                  bugs={this.state.bugsComments}
                  columns={columns}
                />
              </React.Fragment>
            ) : (
              <Loader />
            )}
          </div>
          <div className={styles.sideColumn}>
            {this.state.loaded ? (
              <React.Fragment>
                <BugList
                  showSummaryBar={false}
                  title="Flags"
                  bugs={this.state.bugsFlags}
                  columns={["id", "summary", "last_change_time"]}
                />
              </React.Fragment>
            ) : (
              <Loader />
            )}
          </div>
        </div>
      </div>
    );
  }
}
