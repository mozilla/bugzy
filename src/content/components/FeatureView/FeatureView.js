import React from "react";
import {BugList} from "../BugList/BugList";
import {CopyButton} from "../CopyButton/CopyButton";
import {isBugResolved, runQuery} from "../../lib/utils";
import {getIteration} from "../../../common/iterationUtils";
import {Container} from "../ui/Container/Container";
import {Tabs} from "../ui/Tabs/Tabs";

const currentIteration = getIteration().number;
const currentRelease = currentIteration.split(".")[0];
const prevRelease = parseInt(currentRelease, 10) - 1;
const nextRelease = parseInt(currentRelease, 10) + 1;

const QA_EMAILS = [
  "bnagabandi@getpocket.com"
];

const upliftTrackingField = `cf_tracking_firefox${prevRelease}`;

const displayColumns = [
  "id",
  "summary",
  "assigned_to",
  "cf_fx_iteration",
  "priority"
];
const allColumns = displayColumns.concat([
  "target_milestone",
  "status",
  "resolution",
  "last_change_time",
  "whiteboard",
  "keywords",
  "severity",
  "flags",
  upliftTrackingField,
  `cf_status_firefox${prevRelease}`,
  `cf_status_firefox${currentRelease}`,
  "cf_last_resolved"
]);

function isBugUpliftCandidate(bug) {
  return ["?", "+", "blocking"].includes(bug.cf_tracking_beta) && !(["fixed", "verified"].includes(bug.cf_status_beta));
}

function sortByLastResolved(a, b) {
  if (a.cf_last_resolved > b.cf_last_resolved) { return -1; }
  if (a.cf_last_resolved < b.cf_last_resolved) { return 1; }
  return 0;
}

function doesBugNeedQA(bug) {
  return bug.flags && bug.flags.length && bug.flags.some(flag => QA_EMAILS.includes(flag.requestee));
}

const FeatureBugList = ({hideIfEmpty, bugs, title, extraColumns = [], ...restProps}) => {
  if (hideIfEmpty && !bugs.length) {
    return null;
  }
  return (<React.Fragment>
    {title ? <h3>{title}</h3> : null}
    <BugList
      compact={true}
      showResolvedOption={false}
      bulkEdit={true}
      tags={true}
      bugs={bugs}
      columns={[...displayColumns, ...extraColumns]}
      {...restProps} />
  </React.Fragment>);
};

const EngineeringView = props => {
  const {bugs} = props;
  return (<React.Fragment>
    <FeatureBugList title="Untriaged bugs" hideIfEmpty={true} bugs={bugs.untriaged} extraColumns={["cf_status_nightly", "cf_status_beta"]} />

    <FeatureBugList title="Uplift candidates" hideIfEmpty={true} bugs={bugs.uplift} extraColumns={["cf_status_nightly", "cf_status_beta"]} />
    <FeatureBugList title={`Required for Current Release (Firefox ${currentRelease})`} bugs={bugs.current} />
    <FeatureBugList title={`Required for Next Release (Firefox ${nextRelease})`} bugs={bugs.next} />
    <FeatureBugList title="Metas" hideIfEmpty={true} bugs={bugs.metas} />
    <FeatureBugList title={"Backlog"} bugs={bugs.backlog} />
  </React.Fragment>);
};

const UIView = props => {
  const {bugs} = props;
  return (<React.Fragment>
    <p>To include items in this list, add the <strong>uiwanted</strong> keyword.</p>
    <FeatureBugList hideIfEmpty={true} bugs={bugs.uiwanted} />
  </React.Fragment>);
};

const ResolvedView = props => {
  const {bugs} = props;
  return (<React.Fragment>
    <FeatureBugList title="QA requested" hideIfEmpty={false} crossOutResolved={false} bugs={bugs.needsQA} extraColumns={["cf_status_nightly", "cf_status_beta"]} />
    <FeatureBugList title="Fixed in Nightly" hideIfEmpty={false} crossOutResolved={false} bugs={bugs.nightlyResolved} extraColumns={["cf_status_nightly", "cf_status_beta"]} />
    <FeatureBugList title="Fixed in Beta" hideIfEmpty={true} crossOutResolved={false} bugs={bugs.betaResolved} extraColumns={["cf_status_nightly", "cf_status_beta"]} />
    <FeatureBugList title="Fixed in Release" hideIfEmpty={true} crossOutResolved={false} bugs={bugs.releaseResolved} extraColumns={["target_milestone"]} />
    <FeatureBugList title="Other" hideIfEmpty={true} crossOutResolved={false} bugs={bugs.resolved} extraColumns={["target_milestone"]} />
  </React.Fragment>);
};

export class FeatureView extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {bugs: [], loaded: false};
  }

  innerSort(a, b) {
    const a1 = a.assigned_to;
    const a2 = b.assigned_to;
    const isAUnassigned = a.cf_fx_iteration === "---";
    const isBUnassigned = b.cf_fx_iteration === "---";

    if (a.priority < b.priority) { return -1; }
    if (a.priority > b.priority) { return 1; }

    // Sort unassigned to the bottom
    if (isAUnassigned && !isBUnassigned) { return 1; }
    if (!isAUnassigned && isBUnassigned) { return -1; }

    if (a.cf_fx_iteration < b.cf_fx_iteration) { return -1; }
    if (a.cf_fx_iteration > b.cf_fx_iteration) { return 1; }

    if (a1 < a2) { return -1; }
    if (a1 > a2) { return 1; }

    return 0;
  }

  sortByRelease(bugs) {
    const result = {
      untriaged: [],
      metas: [],
      current: [],
      next: [],
      backlog: [],
      uplift: [],
      uiwanted: [],

      needsQA: [],
      nightlyResolved: [],
      betaResolved: [],
      releaseResolved: [],
      resolved: []
    };
    for (const bug of bugs) {
      // uiwanted bugs can be added to more than one place
      if (bug.keywords.includes("uiwanted")) {
        result.uiwanted.push(bug);
      }

      if (isBugUpliftCandidate(bug)) {
        result.uplift.push(bug);
      } else if (isBugResolved(bug)) {
        if (bug.cf_status_nightly === "fixed" && doesBugNeedQA(bug)) {
          result.needsQA.push(bug);
        } else if (["fixed", "verified"].includes(bug.cf_status_beta)) {
          result.betaResolved.push(bug);
        } else if (["fixed", "verified"].includes(bug.cf_status_nightly)) {
          result.nightlyResolved.push(bug);
        } else if (["---"].includes(bug.target_milestone)) {
          result.resolved.push(bug);
        } else {
          result.releaseResolved.push(bug);
        }
      } else if (bug.keywords.includes("meta")) {
        result.metas.push(bug);
      } else if (bug.priority === "P1") {
        result.current.push(bug);
      } else if (bug.priority === "P2") {
        result.next.push(bug);
      } else if (bug.priority === "--") {
        result.untriaged.push(bug);
      } else {
        result.backlog.push(bug);
      }
    }
    result.uplift.sort(this.innerSort);
    result.current.sort(this.innerSort);
    result.next.sort(this.innerSort);
    result.backlog.sort(this.innerSort);
    result.resolved.sort(sortByLastResolved);
    return result;
  }

  async getBugs(id) {
    if (!id) { return; }
    this.setState({bugs: [], loaded: false});
    const result = await runQuery({
      include_fields: allColumns,
      resolution: ["---", "FIXED"],
      custom: {blocked: id}
    });
    this.setState({bugs: result.bugs, loaded: true});
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.match.params.id !== this.props.match.params.id) {
      this.getBugs(nextProps.match.params.id);
    }
  }

  componentWillMount() {
    this.getBugs(this.props.match.params.id);
  }

  render() {
    const metaId = Number(this.props.match.params.id);
    const metaDisplayName = this.props.metas.filter(meta => meta.id === metaId)[0].displayName;
    const bugsByRelease = this.sortByRelease(this.state.bugs);

    return (<Container
      loaded={this.state.loaded}
      heading={<a href={`https://bugzilla.mozilla.org/show_bug.cgi?id=${metaId}`}>{metaDisplayName}</a>}
      fileBug={`blocked=${metaId}`}
      subHeading={<React.Fragment>This list includes bugs in any component blocking meta bug <a href={`https://bugzilla.mozilla.org/show_bug.cgi?id=${metaId}`}> {metaId}</a> <CopyButton text={metaId} title="Copy bug number" /></React.Fragment>}>
      <Tabs
        baseUrl={this.props.match.url}
        config={[
          {path: "", label: "Engineering", render: props => (<EngineeringView {...props} bugs={bugsByRelease} />)},
          {path: "/design", label: "Design", render: props => (<UIView {...props} bugs={bugsByRelease} />)},
          {path: "/qa", label: "Ready to test", render: props => (<ResolvedView {...props} bugs={bugsByRelease} />)}
        ]} />
    </Container>);
  }
}
