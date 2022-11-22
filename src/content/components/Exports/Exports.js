import React from "react";
import styles from "./Exports.scss";
import gStyles from "../../styles/gStyles.scss";
import { BugList } from "../BugList/BugList";
import { Loader, MiniLoader } from "../Loader/Loader";
import { DateTime } from "luxon";
import { runCachedQueries } from "../../lib/utils";
const querystring = require("querystring");

const columns = ["id", "summary", "last_change_time", "priority"];
const EXPORT_COMPONENT = "New Tab Page";

export class Exports extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      loaded: false,
      awaitingNetwork: false,
      bugs: [],
    };
  }

  async componentWillMount() {
    this._isMounted = true;
    await runCachedQueries(
      {
        include_fields: columns.concat([
          "cf_last_resolved",
          "assigned_to",
          "status",
          "resolution",
          "attachments",
        ]),
        component: EXPORT_COMPONENT,
        status_whiteboard: "[export]",
        order: "Resolution,cf_last_resolved DESC",
      },
      () => this._isMounted,
      ({ rsp: { bugs }, awaitingNetwork }) =>
        this.setState({
          loaded: true,
          awaitingNetwork,
          bugs,
        })
    );
  }

  componentWillUnmount() {
    this._isMounted = false;
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
        <span className={styles.warning}>{daysAgo} days ago</span>, consider
        exporting soon
      </React.Fragment>
    );
  }

  renderContent() {
    const lastExportBug = this.state.bugs.filter(
      bug => bug.cf_last_resolved
    )[0];
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
        <BugList
          bulkEdit={true}
          tags={true}
          bugs={this.state.bugs}
          columns={displayColumns}
        />
        <MiniLoader hidden={!this.state.awaitingNetwork} />
      </React.Fragment>
    );
  }

  renderFileNewBug() {
    const lastFiledExportBug = this.state.bugs[0] || {};
    const url = `https://bugzilla.mozilla.org/enter_bug.cgi?${querystring.stringify(
      {
        bug_severity: "enhancement",
        bug_type: "task",
        comment: "https://github.com/mozilla/activity-stream/compare/...master",
        component: EXPORT_COMPONENT,
        dependson: lastFiledExportBug.id,
        priority: "P2",
        product: "Firefox",
        short_desc: `[Export] Add ... to ${EXPORT_COMPONENT}`,
        status_whiteboard: "[export]",
      }
    )}`;
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
