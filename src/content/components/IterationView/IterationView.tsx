import React from "react";
import { BugList } from "../BugList/BugList";
import { BUGZILLA_TRIAGE_COMPONENTS } from "../../../config/project_settings";
import { useBugFetcher } from "../../hooks/useBugFetcher";
import { Container } from "../ui/Container/Container";
import { getIteration } from "../../../common/iterationUtils";
import { Tabs } from "../ui/Tabs/Tabs";

interface GetQueryOptions {
  iteration: string;
  metas: Array<{ id: string }>;
  components: string[];
}

const getQuery = (options: GetQueryOptions) => ({
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
    { key: "cf_fx_iteration", operator: "substring", value: options.iteration },
    {
      operator: "OR",
      rules: [
        {
          key: "blocked",
          operator: "anywordssubstr",
          value: options.metas
            .filter(m => options.components.includes(m.component))
            .map(m => m.id)
            .join(","),
        },
        {
          key: "component",
          operator: "anyexact",
          value: options.components.join(","),
        },
      ],
    },
  ],
});

function computeHeading(iteration: string): string {
  const currentIterationInformation = getIteration();
  const isCurrent = iteration === currentIterationInformation.number;
  return `${isCurrent ? "Current " : ""}Iteration (${iteration})`;
}

interface IterationViewProps {
  /* e.g. "65.4" */
  iteration: string;
  /* Metas for all bugzy stuff */
  metas: Array<{ id: string; component: string }>;
  match: { url: string };
}

const IterationViewTab = props => {
  const query = getQuery(props);
  console.log(query.rules[1].rules[1]);
  const state = useBugFetcher({
    query,
    updateOn: [],
    transformBugs(bugs) {
      // No transform for now
      return bugs;
    },
  });
  return state.status === "loaded" ? (
    <BugList
      compact={true}
      tags={true}
      bulkEdit={true}
      showHeaderIfEmpty={true}
      bugs={state.bugs}
    />
  ) : (
    "Loading..."
  );
};

export const IterationView: React.FunctionComponent<
  IterationViewProps
> = props => {
  return (
    <Container loaded={true} heading={computeHeading(props.iteration)}>
      <Tabs
        baseUrl={props.match.url}
        config={[
          {
            path: "",
            label: "User Journey",
            render() {
              return (
                <IterationViewTab
                  {...props}
                  components={["Messaging System"]}
                />
              );
            },
          },
          {
            path: "/pocket",
            label: "Pocket",
            render() {
              return (
                <IterationViewTab
                  {...props}
                  components={["Activity Streams: Newtab"]}
                />
              );
            },
          },
        ]}
      />
    </Container>
  );
};
