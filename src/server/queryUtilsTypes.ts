export interface QueryProperties {
  custom?: Object;
  operator?: string;
  key?: string;
  value?: string;
  iteration?: string;
  rules?: QueryProperties | Array<QueryProperties>;
  include_fields?: Array<string>;
}

export interface QueryConfig extends QueryProperties {
  rules: QueryProperties | Array<QueryProperties>;
  include_fields: Array<string>;
}

export type QueryRuleSet =
  | QueryConfig
  | Array<QueryConfig>
  | QueryProperties
  | Array<QueryProperties>;

interface Message {
  bugzillaId: string;
  status: string | React.ReactNode;
}

export interface RSMessage extends Message {
  id: string;
  template: string;
  targeting: string;
  parsedTargetingExpression: any;
  frequency: { lifetime: number };
  content: any;
}

interface Field {
  id: number;
  type:
    | 0 // Field type unknown
    | 1 // Single-line string field
    | 2 // Single value field
    | 3 // Multiple value field
    | 4 // Multi-line text value
    | 5 // Date field with time
    | 6 // Bug ID field
    | 7 // See Also field
    | 8 // Keywords field
    | 9 // Date field
    | 10; // Integer field
  is_custom: boolean;
  name: string;
  display_name: string;
  is_mandatory: boolean;
  is_on_bug_entry: boolean;
  visibility_field: string | null;
  visibility_values: string[];
  value_field: string | null;
  values: Array<FieldValue | KeywordValue | BugStatusValue>;
}

interface FieldValue {
  name: string;
  sort_key: number | void;
  sortkey?: number | void;
  isibility_values?: string[];
  is_active?: boolean;
}

interface KeywordValue extends FieldValue {
  description: string;
}

interface BugStatusValue extends FieldValue {
  is_open: boolean;
  can_change_to: { name: string; comment_required: boolean }[];
}

export type FieldsResponse = { fields: Field[] };
