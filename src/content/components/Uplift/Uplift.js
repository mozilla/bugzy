import React from "react";
import styles from "./Uplift.scss";
import {BugList} from "../BugList/BugList";
import {Loader} from "../Loader/Loader";

import {runQuery} from "../../lib/utils";
import {BUGZILLA_TRIAGE_COMPONENTS} from "../../../config/project_settings";

const columns = ["id", "summary", "last_change_time", "priority"];

export class Uplift extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      loaded: false,
      bugs: []
    };
  }

  async componentWillMount() {
    const trackingField = `cf_tracking_firefox${this.props.prevRelease}`;
    const statusField = `cf_status_firefox${this.props.prevRelease}`;
    const statusNightly = `cf_status_firefox${this.props.release}`;

    const upliftQuery = {
      include_fields: columns.concat([trackingField, statusField, statusNightly, "target"]),
      component: BUGZILLA_TRIAGE_COMPONENTS,
      target_milestone: ["---", `firefox ${this.props.prevRelease + 1}`],
      order: "changeddate DESC"
    };
    upliftQuery.cf_tracking_beta = ["?", "+"];

    const {bugs} = await runQuery(upliftQuery);
    this.setState({
      loaded: true,
      bugs: {
        upliftRequested: bugs.filter(b => b.cf_tracking_beta === "?"),
        upliftTracking: bugs.filter(b => b.cf_tracking_beta === "+" && !(["verified", "fixed"].includes(b.cf_status_beta))),
        upliftComplete: bugs.filter(b => b.cf_tracking_beta === "+" && ["verified", "fixed"].includes(b.cf_status_beta))
      }
    });
  }

  renderContent() {
    const displayColumns = [...columns, "cf_status_nightly", "cf_status_beta"];
    return (<React.Fragment>
      <h2>Tracking requested for {this.props.prevRelease} uplift</h2>
      <BugList bulkEdit={true} tags={true} bugs={this.state.bugs.upliftRequested} columns={displayColumns} />
      <h2>Tracking for {this.props.prevRelease} uplift</h2>
      <BugList bulkEdit={true} tags={true} bugs={this.state.bugs.upliftTracking} columns={displayColumns} />
      <h2>Uplift complete</h2>
      <BugList bulkEdit={true} tags={true} bugs={this.state.bugs.upliftComplete} columns={displayColumns} />
    </React.Fragment>);
  }

  render() {
    return (<div className={styles.container}>
      <h1>Uplift to Firefox {this.props.prevRelease}</h1>
      {this.state.loaded ? this.renderContent() : <Loader />}
    </div>);
  }
}
