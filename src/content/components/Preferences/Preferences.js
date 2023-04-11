import React from "react";
import styles from "./Preferences.scss";
import { prefs } from "../../lib/prefs";
import ReactDOM from "react-dom";
import { ErrorView } from "../ErrorView/ErrorView";

export class Preferences extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      bugzilla_email: prefs.get("bugzilla_email"),
      offline_debug: prefs.get("offline_debug"),
    };
    this.onInputChange = this.onInputChange.bind(this);
    this.onCheckBoxChange = this.onCheckBoxChange.bind(this);
    this.onPrefChange = this.onPrefChange.bind(this);

    for (const pref of ["bugzilla_email", "offline_debug"]) {
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
    fetch()
      .then(rsp => rsp.json())
      .catch(
        ReactDOM.render(
          <ErrorView
            header={"Error"}
            subheader={"There was an error fetching data."}
            buttonText={"Try again"}
          />,
          document.getElementById("root")
        )
      );
  }

  componentWillMount() {
    this.state = {
      bugzilla_email: prefs.get("bugzilla_email"),
      offline_debug: prefs.get("offline_debug"),
    };
  }

  render() {
    return (
      <div className={styles.container}>
        <h1>About</h1>
        <p>
          Please file issues at{" "}
          <a href="https://github.com/mozilla/bugzy/issues/new/choose">
            github.com/mozilla/bugzy
          </a>
        </p>
        {process.env.NODE_ENV === "production" ? null : (
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
            <div className={styles.row}>
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
            </div>
            <div className={styles.row}>
              <div className={styles.col}>
                <button
                  name="iterations_check"
                  onClick={this.onIterationsCheck}>
                  Check iterations (logged in console)
                </button>
              </div>
            </div>
          </div>
        )}

        <h3>Credits</h3>
        <p>
          Icons are designed by <a href="https://smashicons.com/">Smashicons</a>
          , <a href="https://www.freepik.com/">Freepik</a>, and{" "}
          <a href="https://roundicons.com/">Roundicons</a> from{" "}
          <a href="https://www.flaticon.com">flaticon.com</a>
        </p>
      </div>
    );
  }
}
