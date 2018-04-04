import React from "react";
import styles from "./ReleaseReport.scss";
import {BugList} from "../BugList/BugList";
import {Loader} from "../Loader/Loader";
import {CompletionBar} from "../CompletionBar/CompletionBar";
import {runQuery, AS_COMPONENTS} from "../../lib/utils";
import {getIteration} from "../../../lib/iterationUtils";

const OPEN_BUG_URL = "https://bugzilla.mozilla.org/show_bug.cgi?id=";
const columns = ["id", "summary", "last_change_time", "cf_fx_iteration"];

const release = getIteration().number.split(".")[0];

export class ReleaseReport extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {bugs: [], loaded: false};
  }
  async componentWillMount() {
    this.setState({loaded: false})
    const {bugs} = await runQuery({
      include_fields: ["id", "summary", "blocks", "status"],
      iteration: release,
      custom: {
        blocked: this.props.metas.map(m => m.id)
      }
    });
    // const bugs = require("../../../sandbox_results/1520741071242_RESULTS.json").results;
    this.setState({bugs, loaded: true});
  }
  render() {
    return (<div className={styles.container}>
      <h1>Activity Stream {release}</h1>
      <div className={styles.summary}>
        <p>MVP bugs in this release must have an iteration of <strong><code>{release}.x</code></strong> to be counted towards the total.

        <br />See <a href="https://docs.google.com/spreadsheets/d/1OTNN20IhUm_sPq6awL6cqFTShi4kqCGn6IRvQBL-bcQ">this document</a> for stats on our progress.</p>
      </div>

      {this.state.loaded ? this.props.metas.map(meta => {
        const bugs = this.state.bugs.filter(b => b.blocks.includes(meta.id));
        return (<div key={meta.id} className={styles.feature}>
          <h3 className={styles.h3}>{meta.displayName}</h3>
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
      }) : <Loader />}

    </div>);
  }
}
