import React from "react";
import styles from "./FeatureView.scss";
import {BugList} from "../BugList/BugList";
import {Loader} from "../Loader/Loader";
import {runQuery, isBugResolved} from "../../lib/utils";
import {getIteration} from "../../../lib/iterationUtils";
const displayColumns = [
  "id",
  "summary",
  "assigned_to",
  "cf_fx_iteration",
  "priority"
];
const allColumns = displayColumns.concat([
  "status",
  "last_change_time",
  "whiteboard",
  "keywords",
  "severity"
]);

const currentIteration = getIteration().number
const currentVersion = currentIteration.split(".")[0];

export class FeatureView extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {bugs: [], loaded: false};
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

  async getBugs(id) {
    if (!id) return;
    this.setState({bugs: [], loaded: false});
    const {bugs} = await runQuery({
      include_fields: allColumns,
      resolved: ["---", "FIXED"],
      custom: {
        blocked: id,
      }
    });
    this.setState({bugs, loaded: true});
  }

  async componentWillReceiveProps(nextProps) {
    if (nextProps.match.params.id !== this.props.match.params.id) {
      this.getBugs(nextProps.match.params.id);
    }
  }
  componentWillMount() {
    this.getBugs(this.props.match.params.id);
  }
  renderBugs(bugs) {
    const bugsByRelease = this.sortByRelease(this.state.bugs);
    return <React.Fragment>
      <h3>Current Iteration ({currentIteration})</h3>
      <BugList bulkEdit={true} tags={true} bugs={bugsByRelease.current} columns={displayColumns} />
      <h3>To Do</h3>
      <BugList bulkEdit={true} tags={true} bugs={bugsByRelease.backlog} columns={displayColumns} />
      <h3>Resolved</h3>
      <BugList bulkEdit={true} tags={true} bugs={bugsByRelease.resolved} columns={displayColumns} />
    </React.Fragment>
  }
  render() {
    const metasById = {};
    for (const item of this.props.metas) {
      metasById[item.id] = item;
    }

    const metaId = this.props.match.params.id;
    return (<div className={styles.container}>
      <h1><a href={"https://bugzilla.mozilla.org/show_bug.cgi?id=" + metaId}>{metasById[metaId].displayName} ({metaId})</a></h1>
      {this.state.loaded ? this.renderBugs() : <Loader />}
    </div>);
  }
}
