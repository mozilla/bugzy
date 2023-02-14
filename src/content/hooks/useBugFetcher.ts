import { useState, useEffect, useCallback } from "react";
import { QueryManager } from "../lib/utils";

export interface Bug {
  [key: string]: any;
}

export interface Rule {
  key: string;
  operator: string;
  value: string;
}

export interface BugsByMeta {
  [key: string]: any;
}

export interface RuleSet {
  operator?: "OR" | "AND";
  rules: Array<Rule | RuleSet>;
}

export interface BugQuery {
  include_fields: string[];
  resolution?: string;
  priority?: string;
  order?: string;
  component?: string[];
  rules: Array<Rule | RuleSet>;
}

export interface UseBugFetcherOptions {
  query: BugQuery;
  updateOn?: any[];
  bugsByMeta?: any[];
  transformBugs?: (bugs: Bug[]) => Bug[];
  qm: QueryManager;
  isMounted: React.MutableRefObject<boolean>;
}

export interface UseBugFetcherState {
  status: "" | "loading" | "loaded";
  bugs: Bug[];
  bugsByMeta?: BugsByMeta[];
  awaitingNetwork: boolean;
}

export interface UseBugFetcherReturn {
  state: UseBugFetcherState;
  forceFetch: () => void;
}

type BugQueryResponse = { bugs: Bug[] };

export interface BugQueryReturn {
  rsp: BugQueryResponse;
  awaitingNetwork: boolean;
}

export interface BugQueriesReturn {
  rsp: Array<BugQueryResponse>;
  awaitingNetwork: boolean;
}

/* Given a query, fetches and returns bugs from Bugzilla */
export function useBugFetcher(
  options: UseBugFetcherOptions
): UseBugFetcherReturn {
  const { query, updateOn, transformBugs, qm, isMounted } = options;
  const initialState: UseBugFetcherState = {
    bugs: [],
    status: "",
    awaitingNetwork: false,
  };
  const [state, setState] = useState(initialState);
  useEffect(() => {
    setState({ bugs: [], status: "loading", awaitingNetwork: false });
    qm.runCachedQueries(
      query,
      () => isMounted.current,
      ({ rsp: { bugs }, awaitingNetwork }: BugQueryReturn) =>
        setState({
          bugs: transformBugs ? transformBugs(bugs) : bugs,
          status: "loaded",
          awaitingNetwork,
        })
    );
  }, updateOn || [query]); // eslint-disable-line react-hooks/exhaustive-deps
  const forceFetch = useCallback(async () => {
    setState({ ...state, awaitingNetwork: true });
    if (isMounted.current) {
      let { bugs } = await qm.runQueries(query);
      if (isMounted.current) {
        setState({
          ...state,
          bugs: transformBugs ? transformBugs(bugs) : bugs,
          awaitingNetwork: false,
        });
      }
    }
  }, [state, isMounted, qm, query, transformBugs]);
  return { state, forceFetch };
}
