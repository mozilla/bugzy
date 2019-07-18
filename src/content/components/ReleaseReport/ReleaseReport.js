import React from "react";
import { DateTime } from "luxon";
import styles from "./ReleaseReport.scss";
import { Loader } from "../Loader/Loader";
import { CompletionBar } from "../CompletionBar/CompletionBar";
import { Container } from "../ui/Container/Container";
import { isBugResolved, runQuery } from "../../lib/utils";
import { getIteration } from "../../../common/iterationUtils";
import { Tabs } from "../ui/Tabs/Tabs";
import { RELEASE_MILESTONES } from "./Milestones";
import {
  PROJECT_NAME,
  RELEASE_DOC_LINK,
} from "../../../config/project_settings";

const OPEN_BUG_URL = "https://bugzilla.mozilla.org/show_bug.cgi?id=";
// const columns = ["id", "summary", "last_change_time", "cf_fx_iteration"];

const iteration = getIteration();
const release = iteration.number.split(".")[0];
const TIMELINE_DOC =
  "https://docs.google.com/spreadsheets/d/1Umw4Ndf0mDN5K8kA1gWE1FuFNQcuaq8t_cvYb9OR7N8/edit?ts=5d261b74#gid=0";

class ReleaseReportTab extends React.PureComponent {
  render() {
    return (
      <div>
        <div className={styles.summary}>
          <p>
            Bugs in this release must have an iteration of{" "}
            <strong>
              <code>{release}.x</code>
            </strong>{" "}
            to be counted towards the total and part of a prioritized feature.
            Note that resolved bugs other than <code>FIXED</code> (e.g.{" "}
            <code>DUPLICATE</code>) are <em>not</em> included.
          </p>

          <p>
            See <a href={RELEASE_DOC_LINK}>this document</a> for more
            information.
          </p>
        </div>
        <div>
          {this.props.loaded ? (
            this.props.metas
              .filter(meta => meta.priority === "P1")
              .map(meta => {
                const bugs = this.props.bugs.filter(b =>
                  b.blocks.includes(meta.id)
                );
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
                    <CompletionBar
                      bugs={bugs}
                      startDate="2018-03-01"
                      endDate="2018-04-29"
                    />
                    <ul className={styles.bugList}>
                      {bugs.map(bug => (
                        <li
                          key={bug.id}
                          className={isBugResolved(bug) ? styles.resolved : ""}>
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
      </div>
    );
  }
}

class ReleaseDatesTab extends React.PureComponent {
  render() {
    const milestones = RELEASE_MILESTONES;

    return (
      <div>
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
                <th>Date</th>
              </tr>
              {milestones.map(milestone => {
                const date = milestone.calculate();
                return (
                  <tr key={milestone.label}>
                    <td>
                      <strong>{milestone.label}</strong>
                    </td>
                    <td>
                      <time>
                        {date.toLocaleString(
                          Object.assign(
                            { weekday: "long" },
                            DateTime.DATE_SHORT
                          )
                        )}
                      </time>
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

export class ReleaseReport extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      bugs: [],
      loaded: false,
    };
  }

  async componentWillMount() {
    this.setState({ loaded: false });
    const result = await runQuery({
      include_fields: ["id", "summary", "blocks", "status"],
      iteration: release,
      resolution: ["---", "FIXED"],
      custom: { blocked: this.props.metas.map(m => m.id) },
    });
    this.setState({ bugs: result.bugs, loaded: true });
  }

  render() {
    return (
      <Container
        className={styles.container}
        loaded={true}
        heading={`${PROJECT_NAME} ${release}`}>
        <Tabs
          baseUrl={this.props.match.url}
          config={[
            {
              path: "",
              label: "Release Report",
              render: () => {
                return (
                  <ReleaseReportTab
                    loaded={this.state.loaded}
                    metas={this.props.metas}
                    bugs={this.state.bugs}
                  />
                );
              },
            },
            {
              path: "/dates",
              label: "Date Table",
              render: () => {
                return <ReleaseDatesTab />;
              },
            },
          ]}
        />
      </Container>
    );
  }
}
