import React from "react";
import ReactDOM from "react-dom";
import {Router} from "./components/Router/Router";
import {CurrentIteration} from "./components/CurrentIteration/CurrentIteration";
import {Report} from "./components/Report/Report";
import {MyBugs} from "./components/MyBugs/MyBugs";
import {Preferences} from "./components/Preferences/Preferences";
import {ReleaseReport} from "./components/ReleaseReport/ReleaseReport";
import {prefs} from "./lib/prefs";

const ROUTER_CONFIG = [
  {
    id: "current_iteration",
    label: "Current Iteration",
    render: () => <CurrentIteration bugzilla_email={prefs.get("bugzilla_email")} />
  },
  {
    id: "my_bugs",
    label: "My Bugs",
    render: () => <MyBugs bugzilla_email={prefs.get("bugzilla_email")} />
  },
  {
    id: "release_report",
    label: "Release Report",
    render: () => <ReleaseReport />
  },
  {
    id: "prefs",
    label: "Preferences",
    hidden: true,
    render: () => <Preferences />
  }
];

const App = props => {
  return (<Router routes={ROUTER_CONFIG}
    defaultRoute="current_iteration"
    prefsRoute="prefs" />);
}

ReactDOM.render(<App />, document.getElementById("root"));
