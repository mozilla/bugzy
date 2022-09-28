import { useState, useEffect } from "react";
import { runQuery, matchQuery } from "../lib/utils";

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
}

export interface UseBugFetcherReturn {
  status: "" | "loading" | "loaded";
  bugs: Bug[];
  bugsByMeta?: BugsByMeta[];
  awaitingNetwork: boolean;
}

/* Given a query, fetches and returns bugs from Bugzilla */
export function useBugFetcher(
  options: UseBugFetcherOptions
): UseBugFetcherReturn {
  const { query, updateOn, transformBugs } = options;
  const initialState: UseBugFetcherReturn = {
    bugs: [],
    status: "",
    awaitingNetwork: false,
  };
  const [state, setState] = useState(initialState);
  useEffect(() => {
    let isMounted = true;
    const fetchBugs = async () => {
      setState({ bugs: [], status: "loading", awaitingNetwork: false });
      await matchQuery(query)
        .then((resp: { bugs: Bug[] }) => {
          if (isMounted) {
            const bugs = transformBugs ? transformBugs(resp.bugs) : resp.bugs;
            setState({ bugs, status: "loaded", awaitingNetwork: true });
          }
        })
        .catch(() => {});
      await runQuery(query).then((resp: { bugs: Bug[] }) => {
        if (isMounted) {
          const bugs = transformBugs ? transformBugs(resp.bugs) : resp.bugs;
          setState({ bugs, status: "loaded", awaitingNetwork: false });
        }
      });
    };
    fetchBugs();
    return () => {
      isMounted = false;
    };
  }, updateOn || [query]); // eslint-disable-line react-hooks/exhaustive-deps
  return state;
}
