interface Bug {
  [key: string]: any;
}

interface MetaBug {
  id: string;
  component?: string;
  priority?: string;
  displayName?: string;
}

// @: Is this type declaration necessary? Can we just use Bug?
interface BugsByMeta {
  [key: string]: any;
}

interface Rule {
  key: string;
  operator: string;
  value: string;
}

interface RuleSet {
  operator?: "OR" | "AND";
  rules: Array<Rule | RuleSet>;
}

interface BugQuery {
  include_fields: string[];
  resolution?: string;
  priority?: string;
  order?: string;
  component?: string[];
  rules: Array<Rule | RuleSet>;
}

interface UseBugFetcherOptions {
  query: BugQuery;
  updateOn?: any[];
  bugsByMeta?: any[];
  transformBugs?: (bugs: Bug[]) => Bug[];
}

type BugQueryResponse = { bugs: Bug[] };

interface BugQueryReturn {
  rsp: BugQueryResponse;
  awaitingNetwork: boolean;
}

interface BugQueriesReturn {
  rsp: Array<BugQueryResponse>;
  awaitingNetwork: boolean;
}

interface GetQueryOptions {
  iteration?: string;
  metas?: Array<{
    id: string;
    component: string;
    priority?: string;
    displayName?: string;
  }>;
  components: string[];
}

type QueryConfig = {
  rules: QueryConfig | Array<QueryConfig>;
  custom?: Object;
  operator?: string;
  key?: string;
  value?: string;
  iteration?: string;
  include_fields: Array<string>;
};

interface Message {
  bugzillaId: string;
  status: string | React.ReactNode;
}

interface RSMessage extends Message {
  id: string;
  template: string;
  targeting: string;
  parsedTargetingExpression: any;
  frequency: { lifetime: number };
  content: any;
}
