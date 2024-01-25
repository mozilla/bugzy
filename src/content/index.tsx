import React from "react";
import ReactDOM from "react-dom";
import {
  GlobalContextProps,
  GlobalContextProvider,
} from "./components/GlobalContext/GlobalContext";
import { Iterations } from "../common/IterationLookup";
import { QueryManager } from "./lib/utils";
import { Router } from "./components/Router/Router";

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

async function getContextProps(): Promise<GlobalContextProps> {
  const [metas, iterationsLookup, releases, teams] = await Promise.all([
    fetch("/api/metas").then(res => res.json()),
    fetch("/api/iterations").then(res => res.json()),
    fetch("/api/releases").then(res => res.json()),
    fetch("/api/teams").then(res => res.json()),
  ]);
  const iterations = new Iterations(iterationsLookup);
  const qm = makeQueryManager(iterations);
  return { metas, iterations, qm, releases, teams };
}

const App = (props: GlobalContextProps) => {
  const [metas, setMetas] = React.useState(props.metas);
  const [iterations, setIterations] = React.useState(props.iterations);
  const [qm, setQm] = React.useState(props.qm);
  const [releases, setReleases] = React.useState(props.releases);
  const [teams, setTeams] = React.useState(props.teams);
  const refresh = async () => {
    await fetch("/flush_server_caches");
    const newProps = await getContextProps();
    setMetas(newProps.metas);
    setIterations(newProps.iterations);
    setQm(newProps.qm);
    setReleases(newProps.releases);
    setTeams(newProps.teams);
  };
  return (
    <GlobalContextProvider
      metas={metas}
      iterations={iterations}
      qm={qm}
      releases={releases}
      teams={teams}
      refresh={refresh}>
      <Router />
    </GlobalContextProvider>
  );
};

async function main() {
  const { metas, iterations, qm, releases, teams } = await getContextProps();
  ReactDOM.render(
    <App
      metas={metas}
      iterations={iterations}
      qm={qm}
      releases={releases}
      teams={teams}
    />,
    document.getElementById("root")
  );
}

main();
