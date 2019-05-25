import React from "react";
import styles from "./Exports.scss";
import gStyles from "../../styles/gStyles.scss";
import {BugList} from "../BugList/BugList";
import {Loader} from "../Loader/Loader";
import {DateTime} from "luxon";

import {runQuery} from "../../lib/utils";
import {BUGZILLA_TRIAGE_COMPONENTS} from "../../../config/project_settings";

const columns = ["id", "summary", "last_change_time", "priority"];

export class Exports extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      loaded: false,
      bugs: [],
    };
  }

  async componentWillMount() {
    const query = {
      include_fields: columns.concat(["cf_last_resolved", "assigned_to", "status", "resolution"]),
      component: BUGZILLA_TRIAGE_COMPONENTS,
      status_whiteboard: "[export]",
      order: "Resolution,cf_last_resolved DESC",
    };

    const {bugs} = await runQuery(query);
    this.setState({
      loaded: true,
      bugs,
    });
  }

  getRelativeDate(date) {
    const dt = DateTime.fromISO(date);
    const daysAgo = Math.floor(
      DateTime.local()
        .diff(dt, ["days"])
        .toObject().days
    );
    if (daysAgo < 1) {
      return "earlier today";
    } else if (daysAgo === 1) {
      return "yesterday";
    } else if (daysAgo <= 7) {
      return `${daysAgo} days ago`;
    }
    return (
      <React.Fragment>
        <span className={styles.warning}>{daysAgo} days ago</span>, consider exporting soon
      </React.Fragment>
    );
  }

  renderContent() {
    const lastExportBug = this.state.bugs.filter(bug => bug.cf_last_resolved)[0];
    const displayColumns = ["id", "summary", "assigned_to", "cf_last_resolved"];

    return (
      <React.Fragment>
        {lastExportBug ? (
          <p className={styles.note}>
            <a
              target="_blank"
              rel="noopener noreferrer"
              href={`https://bugzilla.mozilla.org/show_bug.cgi?id=${lastExportBug.id}`}>
              Last export
            </a>{" "}
            was {this.getRelativeDate(lastExportBug.cf_last_resolved)}.
          </p>
        ) : null}
        <BugList bulkEdit={true} tags={true} bugs={this.state.bugs} columns={displayColumns} />
      </React.Fragment>
    );
  }

  renderFileNewBug() {
    const lastFiledExportBug = this.state.bugs[0];
    if (!lastFiledExportBug) {
      return null;
    }
    const url = `https://bugzilla.mozilla.org/enter_bug.cgi?dependson=${
      lastFiledExportBug.id
    }&bug_severity=enhancement&bug_type=task&component=Activity%20Streams%3A%20Newtab&priority=P2&product=Firefox&short_desc=%5BExport%5D%20Add%20...%20to%20Activity%20Stream&status_whiteboard=%5Bexport%5D`;
    return (
      <a
        target="_blank"
        rel="noopener noreferrer"
        className={`${gStyles.primaryButton} ${gStyles.headerButton}`}
        href={url}>
        File new bug
      </a>
    );
  }

  render() {
    return (
      <div className={styles.container}>
        <h1>Exports {this.renderFileNewBug()}</h1>
        {this.state.loaded ? this.renderContent() : <Loader />}
      </div>
    );
  }
}
