import { useState, useEffect } from "react";
import { runQuery } from "../lib/utils";

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
  operator?: string;
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
}

/* Given a query, fetches and returns bugs from Bugzilla */
export function useBugFetcher(
  options: UseBugFetcherOptions
): UseBugFetcherReturn {
  const { query, updateOn, transformBugs } = options;
  const initialState: UseBugFetcherReturn = { bugs: [], status: "" };
  const [state, setState] = useState(initialState);
  useEffect(() => {
    const fetchBugs = async () => {
      setState({ bugs: [], status: "loading" });
      const resp = await runQuery(query);
      const bugs = transformBugs ? transformBugs(resp.bugs) : resp.bugs;
      setState({ bugs, status: "loaded" });
    };
    fetchBugs();
  }, updateOn || [query]); // eslint-disable-line react-hooks/exhaustive-deps
  return state;
}
