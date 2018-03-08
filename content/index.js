import React from "react";
import ReactDOM from "react-dom";
import {Router} from "./components/Router/Router";
import {CurrentIteration} from "./components/CurrentIteration/CurrentIteration";
import {Report} from "./components/Report/Report";
import {MyBugs} from "./components/MyBugs/MyBugs";

const ROUTER_CONFIG = [
  // {
  //   id: "my_bugs",
  //   label: "My Bugs",
  //   render: () => <MyBugs />
  // },
  {
    id: "current_iteration",
    label: "Current Iteration",
    render: () => <CurrentIteration />,
  },
  {
    id: "report",
    label: "Report",
    render: () => <Report />
  }
];

const App = props => {
  return (<Router routes={ROUTER_CONFIG} defaultRoute="current_iteration" />);
}

ReactDOM.render(<App />, document.getElementById("root"));
