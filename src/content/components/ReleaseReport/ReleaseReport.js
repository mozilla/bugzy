import React from "react";
import styles from "./ReleaseReport.scss";
import {Loader} from "../Loader/Loader";
import {CompletionBar} from "../CompletionBar/CompletionBar";
import {isBugResolved, runQuery} from "../../lib/utils";
import {getIteration} from "../../../common/iterationUtils";
import {PROJECT_NAME, RELEASE_DOC_LINK} from "../../../config/project_settings";

const OPEN_BUG_URL = "https://bugzilla.mozilla.org/show_bug.cgi?id=";
// const columns = ["id", "summary", "last_change_time", "cf_fx_iteration"];

const release = getIteration().number.split(".")[0];

export class ReleaseReport extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {bugs: [], loaded: false};
  }

  async componentWillMount() {
    this.setState({loaded: false});
    const result = await runQuery({
      include_fields: ["id", "summary", "blocks", "status"],
      iteration: release,
      resolution: ["---", "FIXED"],
      custom: {blocked: this.props.metas.map(m => m.id)},
    });
    // const bugs = require("../../../sandbox_results/1520741071242_RESULTS.json").results;
    this.setState({bugs: result.bugs, loaded: true});
  }

  render() {
    return (
      <div className={styles.container}>
        <h1>
          {PROJECT_NAME} {release}
        </h1>
        <div className={styles.summary}>
          <p>
            Bugs in this release must have an iteration of{" "}
            <strong>
              <code>{release}.x</code>
            </strong>{" "}
            to be counted towards the total and part of a prioritized feature. Note that resolved
            bugs other than <code>FIXED</code> (e.g. <code>DUPLICATE</code>) are <em>not</em>{" "}
            included.
          </p>

          <p>
            See <a href={RELEASE_DOC_LINK}>this document</a> for more information.
          </p>
        </div>

        {this.state.loaded ? (
          this.props.metas
            .filter(meta => meta.priority === "P1")
            .map(meta => {
              const bugs = this.state.bugs.filter(b => b.blocks.includes(meta.id));
              if (!bugs.length) {
                return null;
              }
              const completionPercentage = Math.round(
                (bugs.filter(isBugResolved).length / bugs.length) * 100
              );
              return (
                <div key={meta.id} className={styles.feature}>
                  <h3 className={styles.h3}>
                    {meta.displayName} ({completionPercentage}% complete)
                  </h3>
                  <p className={styles.featureSummary}>{meta.description}</p>
                  <CompletionBar bugs={bugs} startDate="2018-03-01" endDate="2018-04-29" />
                  <ul className={styles.bugList}>
                    {bugs.map(bug => (
                      <li key={bug.id} className={isBugResolved(bug) ? styles.resolved : ""}>
                        <a href={OPEN_BUG_URL + bug.id}>{bug.summary}</a>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })
        ) : (
          <Loader />
        )}
      </div>
    );
  }
}
