import React from "react";
import { Link } from "react-router-dom";
import { DateTime } from "luxon";
import styles from "./ReleaseReport.scss";
import { Loader } from "../Loader/Loader";
import { CompletionBar } from "../CompletionBar/CompletionBar";
import { Container } from "../ui/Container/Container";
import { isBugResolved, runQuery } from "../../lib/utils";
import { Tabs } from "../ui/Tabs/Tabs";
import {
  getReleaseMilestones,
  getNextRelease,
  getPrevRelease,
} from "./Milestones";
import { RELEASE_DOC_LINK } from "../../../config/project_settings";

const OPEN_BUG_URL = "https://bugzilla.mozilla.org/show_bug.cgi?id=";
// const columns = ["id", "summary", "last_change_time", "cf_fx_iteration"];

class ReleaseReportTab extends React.PureComponent {
  render() {
    const release = this.props.release;
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
    const release = this.props.release;
    const milestones = getReleaseMilestones(release);

    const nextURL = this.props.matchUrl.replace(
      /\/\d\d/,
      "/" + getNextRelease(release).toString() + "/dates"
    );

    const prevURL = this.props.matchUrl.replace(
      /\/\d\d/,
      "/" + getPrevRelease(release).toString() + "/dates"
    );

    return (
      <div>
        <div className={styles.summary}>
          <p>
            These are projected dates for the major milestones in Firefox{" "}
            {release}.
          </p>
        </div>
        <span className={styles.prevUrlButton}>
          <Link to={prevURL}>&lt;&lt; Previous Release</Link>
        </span>
        <span className={styles.nextUrlButton}>
          <Link to={nextURL}>Next Release &gt;&gt;</Link>
        </span>
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
                      <time>{date.toLocaleString(DateTime.DATE_HUGE)}</time>
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
    const release = this.props.iteration;
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
    const release = this.props.iteration;
    return (
      <Container
        className={styles.container}
        loaded={true}
        heading={`Firefox ${release}`}>
        <Tabs
          baseUrl={this.props.match.url}
          config={[
            {
              path: "/dates",
              label: "Date Table",
              render: () => {
                return (
                  <ReleaseDatesTab
                    release={this.props.iteration}
                    matchUrl={this.props.match.url}
                  />
                );
              },
            },
            {
              path: "",
              label: "Release Report",
              render: () => {
                return (
                  <ReleaseReportTab
                    loaded={this.state.loaded}
                    metas={this.props.metas}
                    bugs={this.state.bugs}
                    release={this.props.iteration}
                    matchUrl={this.props.match.url}
                  />
                );
              },
            },
          ]}
        />
      </Container>
    );
  }
}
