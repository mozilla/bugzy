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
    this.state = {bugs: [], loading: false};
  }
  async componentWillMount() {
    this.setState({loading: true})
    const {bugs} = await runQuery({
      include_fields: ["id", "summary", "blocks", "status"],
      custom: {
        blocked: metas.map(m => m.id)
      }
    });
    // const bugs = require("../../../sandbox_results/1520741071242_RESULTS.json").results;
    this.setState({bugs, loading: false});
  }
  render() {
    return (<div className={styles.container}>
      <h1>Activity Stream 61</h1>
      <div className={styles.summary}>
        Release notes go here.
      </div>

      {this.state.loading ? "Loading..." : metas.map(meta => {
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
