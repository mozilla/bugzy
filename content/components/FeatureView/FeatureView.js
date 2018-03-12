import React from "react";
import styles from "./FeatureView.scss";
import {BugList} from "../BugList/BugList";
import {runQuery, isBugResolved} from "../../lib/utils";
import {getIteration} from "../../../lib/iterationUtils";
const displayColumns = [
  "id",
  "summary",
  "assigned_to",
  "cf_fx_iteration",
  "target_milestone",
  "priority"
];
const allColumns = displayColumns.concat([
  "status",
  "last_change_time",
]);


const currentIteration = getIteration().number
const currentVersion = currentIteration.split(".")[0];

export class FeatureView extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {bugs: [], loading: false};
  }
  sortByRelease(bugs) {
    const result = {resolved: [], current: [], backlog: []};
    for (const bug of bugs) {
      if (bug.cf_fx_iteration.match(currentIteration)) {
        result.current.push(bug);
      } else if (isBugResolved(bug)) {
        result.resolved.push(bug)
      } else {
        result.backlog.push(bug);
      }
    }
    return result;
  }

  async getBugs(props) {
    if (!props.id) return;
    this.setState({bugs: [], loading: true});
    const bugs = await runQuery({
      include_fields: allColumns,
      custom: {
        blocked: props.id,
      }
    });
    this.setState({bugs, loading: false});
  }

  async componentWillReceiveProps(nextProps) {
    if (nextProps.id !== this.props.id) {
      this.getBugs(nextProps);
    }
  }
  componentWillMount() {
    this.getBugs(this.props);
  }
  renderLoading() {
    return "Loading...";
  }
  renderBugs(bugs) {
    const bugsByRelease = this.sortByRelease(this.state.bugs);
    return <React.Fragment>
      <h3>Current Iteration ({currentIteration})</h3>
      <BugList bulkEdit={true} bugs={bugsByRelease.current} columns={displayColumns} />
      <h3>To Do</h3>
      <BugList bulkEdit={true} bugs={bugsByRelease.backlog} columns={displayColumns} />
      <h3>Resolved</h3>
      <BugList bulkEdit={true} bugs={bugsByRelease.resolved} columns={displayColumns} />
    </React.Fragment>
  }
  render() {
    return (<div className={styles.container}>
      <h1><a href={"https://bugzilla.mozilla.org/show_bug.cgi?id=" + this.props.id}>{this.props.title}</a></h1>
      {this.state.loading ? this.renderLoading() : this.renderBugs()}
    </div>);
  }
}
