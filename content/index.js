import React from "react";
import ReactDOM from "react-dom";
import {Router} from "./components/Router/Router";

const App = props => {
  return (<Router />);
}

ReactDOM.render(<App />, document.getElementById("root"));
