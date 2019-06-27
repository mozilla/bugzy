import React from "react";
import { BugList } from "../BugList/BugList";
import { BUGZILLA_TRIAGE_COMPONENTS } from "../../../config/project_settings";
import { useBugFetcher } from "../../hooks/useBugFetcher";

const getQuery = props => ({
  include_fields: [
    "id",
    "summary",
    "assigned_to",
    "priority",
    "status",
    "whiteboard",
    "keywords",
    "type",
    "flags",
    "blocks",
    "component",
  ],
  rules: [
    { key: "cf_fx_iteration", operator: "substring", value: props.iteration },
    {
      operator: "OR",
      rules: [
        {
          key: "blocked",
          operator: "anywordssubstr",
          value: props.metas.map(m => m.id).join(","),
        },
        {
          key: "component",
          operator: "anyexact",
          value: BUGZILLA_TRIAGE_COMPONENTS.join(","),
        },
      ],
    },
  ],
});

export const IterationView = props => {
  const state = useBugFetcher({
    query: getQuery(props),
    updateOn: [],
    transformBugs(bugs) {
      // No transform for now
      return bugs;
    },
  });
  return (
    <div>
      <BugList
        compact={true}
        tags={true}
        bulkEdit={true}
        showHeaderIfEmpty={true}
        bugs={state.bugs}
      />
    </div>
  );
};
