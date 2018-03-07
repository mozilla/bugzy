import React from "react";
import styles from "./Report.scss";
import {runQuery, AS_COMPONENTS} from "../../lib/utils";

const DEFAULTS = {
  component: ["Activity Streams: Newtab", "New Tab Page", "Activity Streams: Application Servers"],
  include_fields: ["id","summary", "status", "assigned_to", "priority"]
};

export class Report extends React.PureComponent {
  async componentDidMount() {
    const bugsFiled = await runQuery({

    })
  }
  render() {
    const {props} = this;
    return (<div className={styles.container}>
      <h2>Report</h2>
    </div>);
  }
}
