import React from "react";
import styles from "./FeatureView.scss";
import gStyles from "../../styles/gStyles.scss";
import {BugList} from "../BugList/BugList";
import {Loader} from "../Loader/Loader";
import {runQuery, isBugResolved} from "../../lib/utils";
import {getIteration} from "../../../common/iterationUtils";
const displayColumns = [
  "id",
  "summary",
  "assigned_to",
  "cf_fx_iteration",
  "priority"
];
const allColumns = displayColumns.concat([
  "status",
  "resolution",
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
    result.backlog.sort((a, b) => {
      const isAUnassigned = a.cf_fx_iteration === "---";
      const isBUnassigned = b.cf_fx_iteration === "---";

      // Sort unassigned to the bottom
      if (isAUnassigned && !isBUnassigned) return 1;
      if (!isAUnassigned && isBUnassigned) return -1;

      if (a.cf_fx_iteration < b.cf_fx_iteration) return -1;
      if (a.cf_fx_iteration > b.cf_fx_iteration) return 1;

      return 0;
    });
    return result;
  }

  async getBugs(id) {
    if (!id) return;
    this.setState({bugs: [], loaded: false});
    const result = await runQuery({
      include_fields: allColumns,
      resolution: ["---", "FIXED"],
      custom: {
        blocked: id
      }
    });
    this.setState({bugs: result.bugs, loaded: true});
  }

  async componentWillReceiveProps(nextProps) {
    if (nextProps.match.params.id !== this.props.match.params.id) {
      this.getBugs(nextProps.match.params.id);
    }
  }
  componentWillMount() {
    this.getBugs(this.props.match.params.id);
  }
  renderFileNewBug(bugNumber) {
    const url = `https://bugzilla.mozilla.org/enter_bug.cgi?blocked=${bugNumber}&product=Firefox&component=Activity Streams%3A Newtab`;
    return <a className={gStyles.primaryButton + " " + styles.headerButton} href={url}>File new bug</a>
  }
  renderBugs(bugs) {
    const bugsByRelease = this.sortByRelease(this.state.bugs);
    return <React.Fragment>
      <h3>Current Iteration ({currentIteration})</h3>
      <BugList bulkEdit={true} tags={true} bugs={bugsByRelease.current} columns={displayColumns} />
      <h3>To Do</h3>
      <BugList showResolvedOption={false} bulkEdit={true} tags={true} bugs={bugsByRelease.backlog} columns={displayColumns} />
      <h3>Resolved</h3>
      <BugList showResolvedOption={false} bulkEdit={true} tags={true} bugs={bugsByRelease.resolved} columns={displayColumns} />
    </React.Fragment>
  }
  render() {
    const metasById = {};
    for (const item of this.props.metas) {
      metasById[item.id] = item;
    }

    const metaId = this.props.match.params.id;
    return (<div className={styles.container}>
      <h1><a href={"https://bugzilla.mozilla.org/show_bug.cgi?id=" + metaId}>{metasById[metaId].displayName}</a> {this.renderFileNewBug(metaId)}</h1>
      <p className={styles.subheading}>This list includes bugs in any component blocking meta bug <a href={"https://bugzilla.mozilla.org/show_bug.cgi?id=" + metaId}> {metaId}</a>.</p>
      {this.state.loaded ? this.renderBugs() : <Loader />}
    </div>);
  }
}
