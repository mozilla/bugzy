import React from "react";
import styles from "./ReleaseReport.scss";
import {BugList} from "../BugList/BugList";
import {CompletionBar} from "../CompletionBar/CompletionBar";
import {runQuery, AS_COMPONENTS} from "../../lib/utils";
import metas from "../../../config/metas";

const OPEN_BUG_URL = "https://bugzilla.mozilla.org/show_bug.cgi?id=";
const columns = ["id", "summary", "last_change_time", "cf_fx_iteration"];
const MESSAGE_CENTER_BUG = 1432588;

const FAKE_BOOGS = [
  [{status: "RESOLVED"},{status: "RESOLVED"},{status: "RESOLVED"},{},{},{},{}],
  [{status: "RESOLVED"},{status: "RESOLVED"},{status: "RESOLVED"},{},{},{}],
  [{status: "RESOLVED"},{status: "RESOLVED"},{status: "RESOLVED"},{status: "RESOLVED"},{status: "RESOLVED"},{}],
];

export class ReleaseReport extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {bugs: []};
  }
  async componentWillMount() {
    const bugs = await runQuery({
      include_fields: ["id", "summary", "blocks", "status"],
      custom: {
        blocked: metas.map(m => m.id)
      }
    });
    // const bugs = require("../../../sandbox_results/1520741071242_RESULTS.json").results;
    this.setState({bugs});
  }
  render() {
    return (<div className={styles.container}>
      <h1>Activity Stream 61</h1>
      <div className={styles.summary}>
        Release notes are documents that are shared with end users, customers and clients of an organization.
        The definition of the terms 'End Users', 'Clients' and 'Customers' are very relative in nature and might
        have various interpretations based on the specific context. For instance, Quality Assurance group within
        a software development organization can be interpreted as an internal customer. They detail the corrections,
        changes or enhancements made to the service or product the company provides.
      </div>

      {metas.map(meta => {
        const bugs = this.state.bugs.filter(b => b.blocks.includes(meta.id));
        return (<div key={meta.id} className={styles.feature}>
          <h3>{meta.displayName}</h3>
          <p className={styles.featureSummary}>{meta.description}
          </p>
          <CompletionBar
            bugs={bugs}
            startDate="2018-03-01" endDate="2018-04-29" />
          <ul className={styles.bugList}>
            {bugs.map(bug => <li
                key={bug.id}
                className={bug.status === "RESOLVED" ? styles.resolved : ""}>
                <a href={OPEN_BUG_URL + bug.id}>{bug.summary}</a>
            </li>)}
          </ul>
        </div>)
      })}

    </div>);
  }
}
