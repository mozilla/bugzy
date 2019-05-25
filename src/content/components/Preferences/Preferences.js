import React from "react";
import styles from "./Preferences.scss";
import {prefs} from "../../lib/prefs";

export class Preferences extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      bugzilla_email: prefs.get("bugzilla_email"),
      offline_debug: prefs.get("offline_debug"),
    };
    this.onInputChange = this.onInputChange.bind(this);
    this.onCheckBoxChange = this.onCheckBoxChange.bind(this);
  }

  onInputChange(e) {
    const newState = {};
    newState[e.target.name] = e.target.value;
    this.setState(newState);
    prefs.set(e.target.name, e.target.value);
  }

  onCheckBoxChange(e) {
    const newState = {};
    newState[e.target.name] = e.target.checked;
    this.setState(newState);
    prefs.set(e.target.name, e.target.checked);
  }

  render() {
    return (
      <div className={styles.container}>
        <h1>About</h1>
        <p>
          Please file issues at{" "}
          <a href="https://github.com/k88hudson/bugzy/issues">github.com/k88hudson/bugzy</a>
        </p>
        {/* <table className={styles.table}>
        <tbody>
          <tr>
            <td><label htmlFor="bugzilla_email">Bugzilla Email</label></td>
            <td><input name="bugzilla_email" type="email" onChange={this.onInputChange} value={this.state.bugzilla_email} /></td>
          </tr>
          <tr>
            <td><label htmlFor="offline_debug">Debug in offline mode (fake data)</label></td>
            <td><input type="checkbox" name="offline_debug" onChange={this.onCheckBoxChange} checked={this.state.offline_debug} /></td>
          </tr>
        </tbody>
      </table> */}

        <h3>Credits</h3>
        <p>
          Icons are designed by <a href="https://smashicons.com/">Smashicons</a>,{" "}
          <a href="https://www.freepik.com/">Freepik</a>, and{" "}
          <a href="https://roundicons.com/">Roundicons</a> from{" "}
          <a href="https://www.flaticon.com">flaticon.com</a>
        </p>
      </div>
    );
  }
}
