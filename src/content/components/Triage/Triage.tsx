import React from "react";
import {BugList} from "../BugList/BugList";
import {Container} from "../ui/Container/Container";
import {getAdjacentIteration} from "../../../common/iterationUtils";
import {BUGZILLA_TRIAGE_COMPONENTS, POCKET_META} from "../../../config/project_settings";
import {useBugFetcher, Bug} from "../../hooks/useBugFetcher";

const prevColumns = ["id", "summary", "assigned_to", "priority", "blocks"];
const columns = ["id", "summary", "last_change_time", "blocks"];
const prevColumnsDisplay = ["id", "summary", "assigned_to", "priority"];
const columnsDisplay = ["id", "summary", "last_change_time"];

interface SortedBugs {
  needinfo: Bug[];
  uj: Bug[];
  pocket: Bug[];
}

function sortUntriagedBugs(bugs: Bug[]): SortedBugs {
  const result = {
    needinfo: [],
    uj: [],
    pocket: []
  };
  bugs.forEach(b => {
    if (b.flags && b.flags.some(flag => flag.name === "needinfo")) {
      result.needinfo.push(b);
    } else if (b.blocks.includes(POCKET_META)) {
      result.pocket.push(b);
    } else {
      result.uj.push(b);
    }
  });
  return result;
}

const TriageBuglist: React.FC<any> = props => (<BugList
  compact={true}
  showResolvedOption={false}
  showHeaderIfEmpty={true}
  bulkEdit={true}
  tags={true}
  columns={columnsDisplay}
  {...props} />);

interface TriageProps {
  metas: {id: string}[];
}

export const Triage: React.FC<TriageProps> = props => {
  const prevIteration = getAdjacentIteration(-1).number;
  const metas = props.metas.map(m => m.id).join(",");
  const untriaged = useBugFetcher({
    query: {
      include_fields: columns.concat(["whiteboard", "type", "flags"]),
      resolution: "---",
      priority: "--",
      component: BUGZILLA_TRIAGE_COMPONENTS,
      order: "changeddate DESC",
      rules: [
        {key: "keywords", operator: "nowords", value: "meta"},
        {key: "status_whiteboard", operator: "notsubstring", value: "[blocked]"}
      ]
    },
    updateOn: []
  });
  const previous = useBugFetcher({
    query: {
      include_fields: prevColumns.concat(["whiteboard", "type"]),
      resolution: "---",
      rules: [
        {key: "cf_fx_iteration", operator: "substring", value: prevIteration},
        {
          operator: "OR",
          rules: [
            {key: "blocked", operator: "anywordssubstr", value: metas},
            {key: "component", operator: "anyexact", value: BUGZILLA_TRIAGE_COMPONENTS.join(",")}
          ]
        }
      ]
    },
    updateOn: [prevIteration, metas]
  });

  const untriagedBugs = sortUntriagedBugs(untriaged.bugs);
  const prevIterationBugs = sortUntriagedBugs(previous.bugs);

  return (<Container loaded={untriaged.status === "loaded" && previous.status === "loaded"}>
    <React.Fragment>
      <h1>Previous Iteration ({prevIteration})</h1>
      <TriageBuglist subtitle="Activity Stream" bugs={prevIterationBugs.uj} columns={prevColumnsDisplay} />
      <TriageBuglist subtitle="Pocket" bugs={prevIterationBugs.pocket} columns={prevColumnsDisplay} />

      <h1>Untriaged Bugs</h1>
      <TriageBuglist subtitle="Activity Stream" bugs={untriagedBugs.uj} />
      <TriageBuglist subtitle="Pocket" bugs={untriagedBugs.pocket} />

      <h1>Bugs with needinfo</h1>
      <TriageBuglist bugs={[...prevIterationBugs.needinfo, ...untriagedBugs.needinfo]} />
    </React.Fragment>
  </Container>);
};
