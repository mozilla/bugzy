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
