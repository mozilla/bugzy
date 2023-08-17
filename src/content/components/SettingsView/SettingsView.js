import React from "react";
import styles from "./SettingsView.scss";
import { prefs } from "../../lib/prefs";

export class SettingsView extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      bugzilla_email: prefs.get("bugzilla_email"),
      offline_debug: prefs.get("offline_debug"),
      disable_cache: prefs.get("disable_cache"),
    };
    this.onInputChange = this.onInputChange.bind(this);
    this.onCheckBoxChange = this.onCheckBoxChange.bind(this);
    this.onPrefChange = this.onPrefChange.bind(this);

    for (const pref of ["bugzilla_email", "offline_debug", "disable_cache"]) {
      prefs.on(pref, this.onPrefChange);
    }
  }

  onInputChange(e) {
    prefs.set(e.target.name, e.target.value);
  }

  onCheckBoxChange(e) {
    prefs.set(e.target.name, e.target.checked);
  }

  onPrefChange({ name, newValue } = {}) {
    const newState = {};
    newState[name] = newValue;
    this.setState(newState);
  }

  // A button for testing iterations
  onIterationsCheck() {
    fetch("/api/iterations")
      .then(rsp => rsp.json())
      .then(data => console.log(data));
  }

  componentWillMount() {
    this.setState({
      bugzilla_email: prefs.get("bugzilla_email"),
      offline_debug: prefs.get("offline_debug"),
      disable_cache: prefs.get("disable_cache"),
    });
  }

  render() {
    return (
      <div className={styles.container}>
        <h1>Settings</h1>
        <div id="prefs" className={styles.list}>
          <div className={styles.row}>
            <div className={styles.col}>
              <label htmlFor="bugzilla_email">Bugzilla Email</label>
            </div>
            <div className={styles.col}>
              <input
                name="bugzilla_email"
                type="email"
                onChange={this.onInputChange}
                value={this.state.bugzilla_email}
              />
            </div>
          </div>
          {/* <div className={styles.row}>
            <div className={styles.col}>
              <label htmlFor="offline_debug">
                Debug in offline mode (fake data)
              </label>
            </div>
            <div className={styles.col}>
              <input
                type="checkbox"
                name="offline_debug"
                onChange={this.onCheckBoxChange}
                checked={this.state.offline_debug}
              />
            </div>
          </div> */}
          <div className={styles.row}>
            <div className={styles.col}>
              <label htmlFor="disable_cache">Disable cache</label>
            </div>
            <div className={styles.col}>
              <input
                type="checkbox"
                name="disable_cache"
                onChange={this.onCheckBoxChange}
                checked={this.state.disable_cache}
              />
            </div>
          </div>
          <div className={styles.row}>
            <div className={styles.col}>
              <button name="iterations_check" onClick={this.onIterationsCheck}>
                Check iterations (logged in console)
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
