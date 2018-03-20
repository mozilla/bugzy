import React from "react";
import ReactDOM from "react-dom";
import {Router} from "./components/Router/Router";
import {CurrentIteration} from "./components/CurrentIteration/CurrentIteration";
import {Report} from "./components/Report/Report";
import {MyBugs} from "./components/MyBugs/MyBugs";
import {Preferences} from "./components/Preferences/Preferences";
import {ReleaseReport} from "./components/ReleaseReport/ReleaseReport";
import {FeatureView} from "./components/FeatureView/FeatureView";
import {Triage} from "./components/Triage/Triage";
import {prefs} from "./lib/prefs";
import metas from "../config/metas";

const ROUTER_CONFIG = [
  {
    id: "current_iteration",
    label: "Current Iteration",
    icon: "calendar",
    render: () => <CurrentIteration bugzilla_email={prefs.get("bugzilla_email")} />
  },
  {
    id: "triage",
    label: "Triage",
    icon: "inbox",
    render: () => <Triage />
  },
  {
    id: "my_bugs",
    label: "My Bugs",
    icon: "user",
    render: () => <MyBugs bugzilla_email={prefs.get("bugzilla_email")} />
  },
  {
    id: "release_report",
    label: "Report",
    icon: "graph",
    render: () => <ReleaseReport />
  },
  {
    id: "prefs",
    label: "Preferences",
    hidden: true,
    render: () => <Preferences />
  },
  {
    spacer: true
  }
];

metas.forEach(meta => {
  ROUTER_CONFIG.push({
    id: meta.displayName,
    label: meta.displayName,
    render: () => <FeatureView id={meta.id} title={meta.displayName} />
  })
});

const App = props => {
  return (<Router routes={ROUTER_CONFIG}
    defaultRoute="current_iteration"
    prefsRoute="prefs" />);
}

ReactDOM.render(<App />, document.getElementById("root"));
