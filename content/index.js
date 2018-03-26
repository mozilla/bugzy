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

const ROUTER_CONFIG = [
  {
    id: "current_iteration",
    label: "Current Iteration",
    icon: "calendar",
    component: CurrentIteration
  },
  {
    id: "triage",
    label: "Triage",
    icon: "inbox",
    component: Triage,
    render: () => <Triage />
  },
  // {
  //   id: "my_bugs",
  //   label: "My Bugs",
  //   icon: "user",
  //   component: MyBugs,
  // },
  {
    id: "release_report",
    label: "Report",
    icon: "graph",
    component: ReleaseReport,
  },
  {
    id: "prefs",
    label: "Preferences",
    hidden: true,
    component: Preferences,
  },
  {
    spacer: true
  },
  {
    id: "feature/:id",
    label: "Feature",
    component: FeatureView,
    hidden: true
  }
];

const App = props => {
  return (<Router routes={ROUTER_CONFIG}
    defaultRoute="current_iteration"
    prefsRoute="prefs" />);
}

ReactDOM.render(<App />, document.getElementById("root"));
