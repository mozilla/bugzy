import { useState, useEffect } from "react";
import {
  BugQueryReturn,
  UseBugFetcherOptions,
  UseBugFetcherReturn,
} from "./useBugFetcherTypes";

/* Given a query, fetches and returns bugs from Bugzilla */
export function useBugFetcher(
  options: UseBugFetcherOptions
): UseBugFetcherReturn {
  const { query, updateOn, transformBugs, qm } = options;
  const initialState: UseBugFetcherReturn = {
    bugs: [],
    status: "",
    awaitingNetwork: false,
  };
  const [state, setState] = useState(initialState);
  useEffect(() => {
    let isMounted = true;
    setState({ bugs: [], status: "loading", awaitingNetwork: false });
    qm.runCachedQueries(
      query,
      () => isMounted,
      ({ rsp: { bugs }, awaitingNetwork }: BugQueryReturn) =>
        setState({
          bugs: transformBugs ? transformBugs(bugs) : bugs,
          status: "loaded",
          awaitingNetwork,
        })
    );
    return () => {
      isMounted = false;
    };
  }, updateOn || [query]); // eslint-disable-line react-hooks/exhaustive-deps
  return state;
}
