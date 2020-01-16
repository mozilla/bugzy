import React from "react";
import ReactDOM from "react-dom";
import { Router } from "./components/Router/Router";

async function main() {
  const metas = await (await fetch("/api/metas")).json();
  ReactDOM.render(<Router metas={metas} />, document.getElementById("root"));
}

main();
