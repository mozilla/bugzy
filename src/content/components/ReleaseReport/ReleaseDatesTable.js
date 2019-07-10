import React from "react";
import styles from "./ReleaseReport.scss";
import { getIteration } from "../../../common/iterationUtils";
import { PROJECT_NAME } from "../../../config/project_settings";

const iteration = getIteration();
const release = iteration.number.split(".")[0];
const TIMELINE_DOC =
  "https://docs.google.com/spreadsheets/d/1Umw4Ndf0mDN5K8kA1gWE1FuFNQcuaq8t_cvYb9OR7N8/edit?ts=5d261b74#gid=0";

export class ReleaseDatesTable extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      milestones: [
        "Start Day",
        `${release}.1`,
        `${release}.2`,
        `${release}.3`,
        `${release}.4`,
        "Merge Day",
        "Release Day",
      ],
    };
  }

  render() {
    return (
      <div className={styles.container}>
        <h1>
          {PROJECT_NAME} {release}
        </h1>
        <div className={styles.summary}>
          <p>
            These are projected dates for the major milestones in {PROJECT_NAME}{" "}
            {release}.
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
              {this.state.milestones.map(milestone => {
                const date = new Date(iteration.start);
                return (
                  <tr key={milestone}>
                    <td>
                      <strong>{milestone}</strong>
                    </td>
                    <td>
                      <time>
                        {Intl.DateTimeFormat().format(
                          new Date(iteration.start)
                        )}
                      </time>
                    </td>
                    <td>
                      <time>{date.toDateString()}</time>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}
