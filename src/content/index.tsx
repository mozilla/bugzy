import React from "react";
import ReactDOM from "react-dom";
import { GlobalContextProvider } from "./components/GlobalContext/GlobalContext";
import { Iterations } from "../common/IterationLookup";
import { QueryManager } from "./lib/utils";
import { Router } from "./components/Router/Router";
import { ErrorView } from "./components/ErrorView/ErrorView";

async function main() {
  try {
    const [metas, iterationsLookup] = await Promise.all([
      fetch("/api/metas").then(res => res.json()),
      fetch("/api/iterations").then(res => res.json()),
    ]);
    if (!metas || !iterationsLookup) {
      throw null;
    }

    const iterations = new Iterations(iterationsLookup);
    const qm = makeQueryManager(iterations);
    ReactDOM.render(
      <GlobalContextProvider metas={metas} iterations={iterations} qm={qm}>
        <Router />
      </GlobalContextProvider>,
      document.getElementById("root")
    );
  } catch (err) {
    ReactDOM.render(
      <ErrorView
        header={"Error"}
        subheader={"There was an error fetching data."}
        buttonText={"Try again"}
      />,
      document.getElementById("root")
    );
  }
}

function makeQueryManager(iterations: Iterations) {
  const [release] = iterations.getIteration().number.split(".");
  const prevRelease = parseInt(release) - 1;
  function postProcessFn(resp: { bugs: Array<{ [key: string]: any }> }) {
    const bugs =
      resp.bugs &&
      resp.bugs.map(bug => {
        if (`cf_status_firefox${release}` in bug) {
          bug.cf_status_nightly = bug[`cf_status_firefox${release}`];
        }
        if (`cf_status_firefox${prevRelease}` in bug) {
          bug.cf_status_beta = bug[`cf_status_firefox${prevRelease}`];
        }
        if (`cf_tracking_firefox${prevRelease}` in bug) {
          bug.cf_tracking_beta = bug[`cf_tracking_firefox${prevRelease}`];
        }
        return bug;
      });
    return Object.assign({}, resp, bugs);
  }
  return new QueryManager({ postProcessFn });
}

main();
