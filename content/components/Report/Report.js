import React from "react";
import styles from "./Report.scss";
import {runQuery, AS_COMPONENTS} from "../../lib/utils";

export class Report extends React.PureComponent {
  render() {
    const {props} = this;
    return (<div className={styles.container}>
      <h2>Report</h2>
    </div>);
  }
}
