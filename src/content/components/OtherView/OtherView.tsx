import React from "react";
import { BugList } from "../BugList/BugList";
import { useBugFetcher, Bug, BugQuery } from "../../hooks/useBugFetcher";
import { Container } from "../ui/Container/Container";
import { Loader } from "../Loader/Loader";
import { GlobalContext, MetaBug } from "../GlobalContext/GlobalContext";

const COLUMNS = ["id", "summary", "priority", "last_change_time"];

interface GetQueryOptions {
  metas: MetaBug[];
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
  match: { url: string };
  components: Array<string>;
}

export const OtherView: React.FC<OtherViewProps> = ({ components }) => {
  const { metas, qm } = React.useContext(GlobalContext);
  const query = React.useMemo(() => getQuery({ metas, components }), [
    metas,
    components,
  ]);
  const isMounted = React.useRef(true);
  const { state, forceFetch } = useBugFetcher({
    query,
    qm,
    transformBugs: bugs => bugs.sort(sortBugs),
    isMounted,
  });
  const onClick = React.useCallback(() => forceFetch(), [forceFetch]);
  React.useEffect(
    () => () => {
      isMounted.current = false;
    },
    []
  );

  return (
    <Container
      loaded={true}
      heading="Other bugs"
      subHeading={`This list includes bugs in the ${components.join(
        ", "
      )} components that are not blocked by a P1 meta bug.`}>
      {state.status === "loaded" ? (
        <BugList
          compact={true}
          tags={true}
          bulkEdit={true}
          showHeaderIfEmpty={true}
          bugs={state.bugs}
          columns={COLUMNS}
        />
      ) : (
        <Loader />
      )}
    </Container>
  );
};
