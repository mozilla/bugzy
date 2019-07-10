import React from "react";
import styles from "./ReleaseReport.scss";
import { Loader } from "../Loader/Loader";
import { CompletionBar } from "../CompletionBar/CompletionBar";
import { isBugResolved, runQuery } from "../../lib/utils";
import { getIteration } from "../../../common/iterationUtils";
import {
  PROJECT_NAME,
  RELEASE_DOC_LINK,
} from "../../../config/project_settings";

const iteration = getIteration();
const release = iteration.number.split(".")[0];
const TIMELINE_DOC =
  "https://docs.google.com/spreadsheets/d/1Umw4Ndf0mDN5K8kA1gWE1FuFNQcuaq8t_cvYb9OR7N8/edit?ts=5d261b74#gid=0";

export class ReleaseDatesTable extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = { bugs: [], loaded: false };
  }

  async componentWillMount() {
    this.setState({ loaded: false });
    const result = await runQuery({
      include_fields: ["id", "summary", "blocks", "status"],
      iteration: release,
      resolution: ["---", "FIXED"],
      custom: { blocked: this.props.metas.map(m => m.id) },
    });
    // const bugs = require("../../../sandbox_results/1520741071242_RESULTS.json").results;
    this.setState({ bugs: result.bugs, loaded: true });
  }

  render() {
    return (
      <div className={styles.container}>
        <h1>
          {PROJECT_NAME} {release}
        </h1>
        <div className={styles.summary}>
          <p>
            These are projected dates for the major milestones in {release}.
          </p>

          <p>
            See <a href={TIMELINE_DOC}>this document</a> for more information.
          </p>
        </div>
        <div className={styles.table}>
          <table>
            <tbody>
              <tr>
                <th>Milestone</th>
                <th>Day</th>
                <th>Date</th>
              </tr>
              <tr>
                <td>Start Day</td>
                <td>427311</td>
                <td>
                  <time dateTime="2010-06-03">June 3, 2010</time>
                </td>
              </tr>
              <tr>
                <td>{release}.1</td>
                <td>533175</td>
                <td>
                  <time dateTime="2011-01-13">January 13, 2011</time>
                </td>
              </tr>
              <tr>
                <td>{release}.2</td>
                <td>601942</td>
                <td>
                  <time dateTime="2012-07-23">July 23, 2012</time>
                </td>
              </tr>
              <tr>
                <td>{release}.3</td>
                <td>601942</td>
                <td>
                  <time dateTime="2012-07-23">July 23, 2012</time>
                </td>
              </tr>
              <tr>
                <td>{release}.4</td>
                <td>601942</td>
                <td>
                  <time dateTime="2012-07-23">July 23, 2012</time>
                </td>
              </tr>
              <tr>
                <td>Merge Day</td>
                <td>601942</td>
                <td>
                  <time dateTime="2012-07-23">July 23, 2012</time>
                </td>
              </tr>
              <tr>
                <td>Release Day</td>
                <td>601942</td>
                <td>
                  <time dateTime="2012-07-23">July 23, 2012</time>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}
