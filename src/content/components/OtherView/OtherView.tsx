import React from "react";
import { BugList } from "../BugList/BugList";
import { useBugFetcher, Bug, BugQuery } from "../../hooks/useBugFetcher";
import { Container } from "../ui/Container/Container";
import { Loader } from "../Loader/Loader";

const COLUMNS = ["id", "summary", "priority", "last_change_time"];

interface GetQueryOptions {
  metas: Array<{
    id: string;
    component: string;
    priority?: string;
    displayName?: string;
  }>;
  components: Array<string>;
}

const getQuery = (options: GetQueryOptions): BugQuery => ({
  include_fields: [
    "id",
    "summary",
    "priority",
    "status",
    "whiteboard",
    "keywords",
    "type",
    "blocks",
    "cf_fx_iteration",
    "last_change_time",
  ],
  component: options.components,
  resolution: "---",
  order: "changeddate DESC",
  rules: [
    {
      key: "blocked",
      operator: "nowordssubstr",
      value: options.metas
        .filter(meta => meta.priority === "P1")
        .map(m => m.id)
        .join(","),
    },
    { key: "keywords", operator: "nowordssubstr", value: "meta" },
    { key: "priority", operator: "notequals", value: "--" },
  ],
});

const sortBugs = (a: Bug, b: Bug): number => {
  if (a.priority < b.priority) {
    return -1;
  }
  if (a.priority > b.priority) {
    return 1;
  }
  return 0;
};

interface OtherViewProps {
  metas: Array<{
    id: string;
    component: string;
    priority?: string;
    displayName?: string;
  }>;
  match: { url: string };
  components: Array<string>;
}

export const OtherView: React.FC<OtherViewProps> = props => {
  const query = getQuery(props);
  const { status, bugs } = useBugFetcher({
    query,
    updateOn: [],
    transformBugs: bugs => bugs.sort(sortBugs),
  });

  return (
    <Container
      loaded={true}
      heading="Other bugs"
      subHeading={`This list includes bugs in the ${props.components.join(
        ", "
      )} components that are not blocked by a P1 meta bug.`}>
      {status === "loaded" ? (
        <BugList
          compact={true}
          tags={true}
          bulkEdit={true}
          showHeaderIfEmpty={true}
          bugs={bugs}
          columns={COLUMNS}
        />
      ) : (
        <Loader />
      )}
    </Container>
  );
};
