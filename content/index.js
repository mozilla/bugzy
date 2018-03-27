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

const App = props => {
  return (<Router />);
}

ReactDOM.render(<App />, document.getElementById("root"));
