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

    const upliftQuery = {
      include_fields: columns.concat([trackingField, statusField, "target"]),
      component: BUGZILLA_TRIAGE_COMPONENTS,
      target_milestone: ["---", `firefox ${this.props.prevRelease + 1}`],
      order: "changeddate DESC"
    };
    upliftQuery[trackingField] = ["?", "+"];

    const {bugs} = await runQuery(upliftQuery);
    this.setState({
      loaded: true,
      bugs: {
        upliftRequested: bugs.filter(b => b[trackingField] === "?"),
        upliftApproved: bugs.filter(b => b[trackingField] === "+" && b[statusField] !== "verified"),
        upliftVerified: bugs.filter(b => b[trackingField] === "+" && b[statusField] === "verified")
      }
    });
  }

  renderContent() {
    return (<React.Fragment>
      <h2>Uplift requested</h2>
      <BugList bulkEdit={true} tags={true} bugs={this.state.bugs.upliftRequested} columns={columns} />
      <h2>Uplift approved</h2>
      <BugList bulkEdit={true} tags={true} bugs={this.state.bugs.upliftApproved} columns={columns} />
      <h2>Uplift verified</h2>
      <BugList bulkEdit={true} tags={true} bugs={this.state.bugs.upliftVerified} columns={columns} />
    </React.Fragment>);
  }

  render() {
    return (<div className={styles.container}>
      <h1>Uplift to Firefox {this.props.prevRelease}</h1>
      {this.state.loaded ? this.renderContent() : <Loader />}
    </div>);
  }
}
