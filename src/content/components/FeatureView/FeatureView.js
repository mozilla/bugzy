import React from "react";
import styles from "./FeatureView.scss";
import gStyles from "../../styles/gStyles.scss";
import {BugList} from "../BugList/BugList";
import {Loader} from "../Loader/Loader";
import {CopyButton} from "../CopyButton/CopyButton";
import {isBugResolved, runQuery} from "../../lib/utils";
import {getIteration} from "../../../common/iterationUtils";
import {BUGZILLA_PRODUCT, FILE_NEW_BUGZILLA_COMPONENT} from "../../../config/project_settings";

import {NavLink, Route, Switch} from "react-router-dom";

const currentIteration = getIteration().number;
const currentRelease = currentIteration.split(".")[0];
const prevRelease = parseInt(currentRelease, 10) - 1;
const nextRelease = parseInt(currentRelease, 10) + 1;

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

const EngineeringView = props => {
  const {bugs} = props;
  return (<React.Fragment>

    {bugs.untriaged.length ? (<React.Fragment><h3>Untriaged bugs</h3>
      <BugList compact={true} showResolvedOption={false} bulkEdit={true} tags={true} bugs={bugs.untriaged} columns={[...displayColumns, "cf_status_nightly", "cf_status_beta"]} />
    </React.Fragment>) : ""}

    {bugs.uplift.length ? (<React.Fragment><h3>Uplift candidates</h3>
      <BugList compact={true} showResolvedOption={false} bulkEdit={true} tags={true} bugs={bugs.uplift} columns={[...displayColumns, "cf_status_nightly", "cf_status_beta"]} />
    </React.Fragment>) : ""}

    <h3>Required for Current Release (Firefox {currentRelease})</h3>
    <BugList compact={true} showResolvedOption={false} bulkEdit={true} tags={true} bugs={bugs.current} columns={displayColumns} />

    <h3>Required for Next Release (Firefox {nextRelease})</h3>
    <BugList compact={true} showResolvedOption={false} bulkEdit={true} tags={true} bugs={bugs.next} columns={displayColumns} />

    <h3>Backlog</h3>
    <BugList compact={true}showResolvedOption={false} bulkEdit={true} tags={true} bugs={bugs.backlog} columns={displayColumns} />
  </React.Fragment>);
};

const ResolvedView = props => (<React.Fragment>
  <BugList
    crossOutResolved={false}
    showResolvedOption={false}
    bulkEdit={true}
    tags={true}
    bugs={props.bugs.resolved}
    columns={[...displayColumns, "cf_status_nightly", "cf_status_beta"]} />
</React.Fragment>);

const tabConfig = [
  {path: "", label: "Engineering", component: EngineeringView},
  // {path: "/qa", label: "QA"},
  {path: "/resolved", label: "Resolved", component: ResolvedView}
  // TODO: replace resolve wiith these?
  // {path: "/nightly", label: "Nightly"},
  // {path: "/beta", label: "Beta"},
  // {path: "/release", label: "Release"}
];

export class FeatureView extends React.PureComponent {
  constructor(props) {
    super(props);
    this.renderTabLink = this.renderTabLink.bind(this);
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
    const result = {resolved: [], untriaged: [], current: [], next: [], backlog: [], uplift: []};
    for (const bug of bugs) {
      if (isBugUpliftCandidate(bug)) {
        result.uplift.push(bug);
      } else if (isBugResolved(bug)) {
        result.resolved.push(bug);
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

  renderFileNewBug(bugNumber) {
    const url = `https://bugzilla.mozilla.org/enter_bug.cgi?blocked=${bugNumber}&product=${BUGZILLA_PRODUCT}&component=${FILE_NEW_BUGZILLA_COMPONENT}`;
    return <a target="_blank" rel="noopener noreferrer" className={`${gStyles.primaryButton} ${gStyles.headerButton}`} href={url}>File new bug</a>;
  }

  renderTabLink(tabInfo, i) {
    return (<li key={i}>
      <NavLink exact={true} activeClassName={styles.activeTab} to={this.props.match.url + tabInfo.path}>
        {tabInfo.label}
      </NavLink>
    </li>);
  }

  renderTabRoute(bugsByRelease) {
    return (tabInfo, i) => {
      const WrapperComponent = tabInfo.component;
      return (<Route
        key={i}
        exact={true}
        path={this.props.match.url + tabInfo.path}
        render={props => <WrapperComponent {...props} bugs={bugsByRelease} />} // eslint-disable-line
        bugs={bugsByRelease} />);
    };
  }

  renderBugs(bugs) {
    const bugsByRelease = this.sortByRelease(this.state.bugs);
    return (<React.Fragment>

      <div className={styles.tabsContainer}>
        <ul>
          {tabConfig.map(this.renderTabLink)}
        </ul>
      </div>
      <Switch>
        {tabConfig.map(this.renderTabRoute(bugsByRelease))}
      </Switch>
    </React.Fragment>);
  }

  render() {
    const metasById = {};
    for (const item of this.props.metas) {
      metasById[item.id] = item;
    }

    const metaId = this.props.match.params.id;
    return (<div className={styles.container}>
      <h1><a href={`https://bugzilla.mozilla.org/show_bug.cgi?id=${metaId}`}>{metasById[metaId].displayName}</a> {this.renderFileNewBug(metaId)}</h1>
      <p className={styles.subheading}>This list includes bugs in any component blocking meta bug <a href={`https://bugzilla.mozilla.org/show_bug.cgi?id=${metaId}`}> {metaId}</a> <CopyButton text={metaId} title="Copy bug number" /> </p>
      {this.state.loaded ? this.renderBugs() : <Loader />}
    </div>);
  }
}
