import React from "react";
import { BugList } from "../BugList/BugList";
import { useBugFetcher, Bug, BugQuery } from "../../hooks/useBugFetcher";
import { Container } from "../ui/Container/Container";
import { MiniLoader } from "../Loader/Loader";
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
  const query = React.useMemo(
    () => getQuery({ metas, components }),
    [metas, components]
  );
  const { status, bugs, awaitingNetwork } = useBugFetcher({
    query,
    qm,
    transformBugs: bugs => bugs.sort(sortBugs),
  });
  const getBugWarning = React.useCallback(
    (bug: Bug) => {
      if (!metas.some(m => bug.blocks?.includes(m.id))) {
        return {
          type: "no-meta",
          message:
            "This bug is not blocking any meta bug in Messaging System. Please add a meta bug!",
        };
      }
      return {};
    },
    [metas]
  );

  return (
    <Container
      loaded={status === "loaded"}
      heading="Other bugs"
      subHeading={`This list includes bugs in the ${components.join(
        ", "
      )} components that are not blocked by a P1 meta bug.`}>
      <BugList
        compact={true}
        tags={true}
        bulkEdit={true}
        showHeaderIfEmpty={true}
        bugs={bugs}
        columns={COLUMNS}
        getBugWarning={getBugWarning}
      />
      <MiniLoader hidden={!awaitingNetwork} />
    </Container>
  );
};
