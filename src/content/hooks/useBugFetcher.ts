import { useState, useEffect } from "react";
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
}

export interface UseBugFetcherReturn {
  status: "" | "loading" | "loaded";
  bugs: Bug[];
  bugsByMeta?: BugsByMeta[];
  awaitingNetwork: boolean;
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
      ({ rsp: { bugs }, awaitingNetwork }: BugQueryReturn) => {
        setState({
          bugs: transformBugs ? transformBugs(bugs) : bugs,
          status: "loaded",
          awaitingNetwork,
        });
      }
    );
    return () => {
      isMounted = false;
    };
  }, updateOn || [query]); // eslint-disable-line react-hooks/exhaustive-deps
  return state;
}
