import React from "react";
import { BugList } from "../BugList/BugList";
import { useBugFetcher, Bug } from "../../hooks/useBugFetcher";
import { Container } from "../ui/Container/Container";
import { getIteration } from "../../../common/iterationUtils";
import { Tabs } from "../ui/Tabs/Tabs";

interface GetQueryOptions {
  iteration: string;
  metas: Array<{
    id: string;
    component: string;
    priority?: string;
    displayName?: string;
  }>;
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

interface BugProps {
  id: any;
  summary: string;
  assigned_to?: string;
  priority?: string;
  status?: string;
  whiteboard?: string;
  keywords?: string;
  type?: string;
  flags?: string;
  blocks?: string;
  component: string;
}

function computeHeading(iteration: string): string {
  const currentIterationInformation = getIteration();
  const isCurrent = iteration === currentIterationInformation.number;
  return `${isCurrent ? "Current " : ""}Iteration (${iteration})`;
}

interface GetSortOptions {
  metas: Array<{
    id: string;
    component?: string;
    priority?: string;
    displayName?: string;
  }>;
  bugs: any[];
}

function sortByMeta(
  metas: GetSortOptions["metas"],
  bugs: any[]
): { [metaNumber: string]: Bug[] } {
  let bugsByMeta = {};
  // DO SOME SORTING YO
  bugs.forEach(bug => {
    if (!metas.length) {
      metas.push({ id: "other", displayName: "Other" });
    }

    metas.forEach(meta => {
      if (!bugsByMeta[meta.id]) {
        bugsByMeta[meta.id] = { meta, bugs: [] };
      }
      bugsByMeta[meta.id].bugs.push(bug);
    });
  });
  return bugsByMeta;
}

function renderBugList(meta: GetSortOptions["metas"], bugs: any[]) {
  return (
    <BugList
      key={meta.id}
      compact={true}
      subtitle={meta.displayName}
      tags={true}
      bulkEdit={true}
      showHeaderIfEmpty={true}
      bugs={bugs}
      bugzilla_email={this.state.bugzilla_email}
    />
  );
}

interface IterationViewProps {
  /* e.g. "65.4" */
  iteration: string;
  /* Metas for all bugzy stuff */
  metas: Array<{
    id: string;
    component: string;
    priority?: string;
    displayName?: string;
  }>;
  match: { url: string };
}

const IterationViewTab = props => {
  const query = getQuery(props);
  console.log(query.rules[1].rules[1]);
  const state = useBugFetcher({
    query,
    updateOn: [],
  });

  sortByMeta(this.props.metas, state.bugs);

  return state.status === "loaded"
    ? // ForEach meta....
      Object.keys(state.bugsByMeta).map(id =>
        renderBugList(state.bugsByMeta[id].meta, state.bugsByMeta[id].bugs)
      )
    : "Loading...";
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
                  metas={this.props.metas}
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
                  metas={this.props.metas}
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
