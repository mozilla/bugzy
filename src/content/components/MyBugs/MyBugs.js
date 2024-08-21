import React from "react";
import * as styles from "./MyBugs.module.scss";
import * as gStyles from "../../styles/gStyles.module.scss";
import { GlobalContext } from "../GlobalContext/GlobalContext";
import { BugList } from "../BugList/BugList";
import { prefs } from "../../lib/prefs";
import { Loader, MiniLoader } from "../Loader/Loader";

const columns = ["id", "summary", "priority", "cf_fx_points", "last_change_time", "cf_fx_iteration"];
const include_fields = columns.concat([
  "whiteboard",
  "keywords",
  "type",
  "status",
  "flags",
]);

export class MyBugs extends React.PureComponent {
  static contextType = GlobalContext;

  constructor(props) {
    super(props);
    this.state = {
      bugsAssigned: [],
      bugsFlags: [],
      bugsComments: [],
      bugsClosed: [],
      loaded: false,
      awaitingNetwork: false,
      email: null,
      showSettings: false,
      emailWasChanged: false,
    };
    this.onPrefChange = this.onPrefChange.bind(this);
    this.onEmailChange = this.onEmailChange.bind(this);
    this.onEmailSubmit = this.onEmailSubmit.bind(this);
    this.toggleSettings = this.toggleSettings.bind(this);

    prefs.on("bugzilla_email", this.onPrefChange);
  }

  async refresh() {
    this.setState({ loaded: false });
    const newState = {
      emailWasChanged: false,
      loaded: true,
      awaitingNetwork: false,
      bugsAssigned: [],
      bugsFlags: [],
      bugsComments: [],
      bugsClosed: [],
    };
    if (this.state.email) {
      await this.context.qm.runCachedQueries(
        [
          {
            include_fields,
            resolution: "---",
            order: "changeddate DESC",
            custom: { assigned_to: { equals: this.state.email } },
          },
          {
            include_fields,
            resolution: "---",
            order: "changeddate DESC",
            custom: { "requestees.login_name": { equals: this.state.email } },
          },
          {
            include_fields,
            order: "changeddate DESC",
            limit: 30,
            custom: { commenter: { equals: this.state.email } },
          },
          {
            include_fields,
            order: "changeddate DESC",
            limit: 50,
            resolution: "FIXED",
            custom: { assigned_to: { equals: this.state.email } },
          },
        ],
        () => this._isMounted,
        ({
          rsp: [
            { bugs: bugsAssigned },
            { bugs: bugsFlags },
            { bugs: bugsComments },
            { bugs: bugsClosed },
          ],
          awaitingNetwork,
        }) => {
          newState.bugsAssigned = bugsAssigned;
          newState.bugsFlags = bugsFlags;
          newState.bugsComments = bugsComments;
          newState.bugsClosed = bugsClosed;
          newState.awaitingNetwork = awaitingNetwork;
          this.setState(newState);
        }
      );
      return;
    }
    this.setState(newState);
  }

  componentWillMount() {
    this._isMounted = true;
    const email = prefs.get("bugzilla_email");
    this.setState({ email, showSettings: !email }, this.refresh);
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  onEmailChange(e) {
    this.setState({ email: e.target.value, emailWasChanged: true });
  }

  onEmailSubmit(e) {
    prefs.set("bugzilla_email", this.state.email);
    e.preventDefault();
  }

  onPrefChange({ name, oldValue, newValue } = {}) {
    if (name === "bugzilla_email") {
      const emailWasChanged = oldValue !== newValue;
      this.setState(
        { email: newValue, emailWasChanged },
        emailWasChanged ? this.refresh : null
      );
    }
  }

  toggleSettings() {
    this.setState(state => ({ showSettings: !state.showSettings }));
  }

  render() {
    return (
      <div className={styles.container}>
        <h1>
          My Bugs{" "}
          <button
            onClick={this.toggleSettings}
            className={styles.settingsBtn}
            title="settings"
          />
        </h1>
        <p hidden={!this.state.showSettings} className={styles.settingSection}>
          <form onSubmit={this.onEmailSubmit}>
            <label>Bugzilla Email </label>
            <input
              className={gStyles.smallInput}
              type="text"
              value={this.state.email}
              onChange={this.onEmailChange}
            />
            {this.state.loaded && this.state.emailWasChanged ? (
              <button className={gStyles.primaryButton} type="submit">
                Save
              </button>
            ) : null}
          </form>
        </p>
        {this.state.loaded ? (
          <div className={styles.wrapper}>
            <div className={styles.mainColumn}>
              <React.Fragment>
                <BugList
                  showSummaryBar={false}
                  title="Assigned to me"
                  bugs={this.state.bugsAssigned}
                  columns={columns}
                />
                <BugList
                  showSummaryBar={false}
                  title="Recently Closed"
                  bugs={this.state.bugsClosed}
                  columns={columns}
                  crossOutResolved={false}
                />
              </React.Fragment>
            </div>
            <div className={styles.sideColumn}>
              <React.Fragment>
                <BugList
                  showSummaryBar={false}
                  title="Flags"
                  bugs={this.state.bugsFlags}
                  columns={["id", "summary", "priority", "cf_fx_points", "last_change_time"]}
                />
                <BugList
                  showSummaryBar={false}
                  title="Recently commented on"
                  bugs={this.state.bugsComments}
                  columns={["id", "summary", "priority", "cf_fx_points", "last_change_time"]}
                />
              </React.Fragment>
            </div>
            <MiniLoader hidden={!this.state.awaitingNetwork} />
          </div>
        ) : (
          <Loader />
        )}
      </div>
    );
  }
}
