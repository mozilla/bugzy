import React from "react";
import { Link } from "react-router-dom";
import { DateTime } from "luxon";
import * as styles from "./ReleaseReport.module.scss";
import { GlobalContext } from "../GlobalContext/GlobalContext";
import { Loader, MiniLoader } from "../Loader/Loader";
import { CompletionBar } from "../CompletionBar/CompletionBar";
import { Container } from "../ui/Container/Container";
import { isBugResolved } from "../../lib/utils";
import { getMondayBefore } from "../../../common/IterationLookup";
import { Tabs } from "../ui/Tabs/Tabs";
import { RELEASE_DOC_LINK } from "../../../config/project_settings";

const OPEN_BUG_URL = "https://bugzilla.mozilla.org/show_bug.cgi?id=";
// const columns = ["id", "summary", "last_change_time", "cf_fx_iteration"];

class ReleaseReportTab extends React.PureComponent {
  static contextType = GlobalContext;

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
            this.context.metas
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
  static contextType = GlobalContext;

  render() {
    const release = this.props.release;
    const allMilestones = new Milestones(this.context.iterations);
    const releaseMilestones = allMilestones.getReleaseMilestones(release);

    const nextURL = this.props.matchUrl.replace(
      /\/\d+/,
      "/" + Milestones.getNextRelease(release).toString() + "/dates"
    );

    const prevURL = this.props.matchUrl.replace(
      /\/\d+/,
      "/" + Milestones.getPrevRelease(release).toString() + "/dates"
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
              {releaseMilestones.map(milestone => {
                const date = milestone.calculate();
                return date ? (
                  <tr key={milestone.label}>
                    <td>
                      <strong>{milestone.label}</strong>
                    </td>
                    <td>
                      <time>{date.toLocaleString(DateTime.DATE_HUGE)}</time>
                    </td>
                  </tr>
                ) : null;
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}

export class ReleaseReport extends React.PureComponent {
  static contextType = GlobalContext;

  constructor(props) {
    super(props);
    this.state = {
      bugs: [],
      loaded: false,
      awaitingNetwork: false,
    };
  }

  async componentWillMount() {
    this._isMounted = true;
    const release = this.props.iteration;
    this.setState({ loaded: false, awaitingNetwork: false });
    await this.context.qm.runCachedQueries(
      {
        include_fields: ["id", "summary", "blocks", "status"],
        iteration: release,
        resolution: ["---", "FIXED"],
        custom: { blocked: this.context.metas.map(m => m.id) },
      },
      () => this._isMounted,
      ({ rsp: { bugs }, awaitingNetwork }) =>
        this.setState({ bugs, loaded: true, awaitingNetwork })
    );
  }

  componentWillUnmount() {
    this._isMounted = false;
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
                    bugs={this.state.bugs}
                    release={this.props.iteration}
                    matchUrl={this.props.match.url}
                  />
                );
              },
            },
          ]}
        />
        <MiniLoader hidden={!this.state.awaitingNetwork} />
      </Container>
    );
  }
}

class Milestones {
  constructor(iterations) {
    this.iterations = iterations;
  }

  static getNextRelease(release) {
    return parseInt(release) + 1;
  }

  static getPrevRelease(release) {
    return parseInt(release) - 1;
  }

  getReleaseMilestones(release) {
    const getEndDate = milestone => {
      const endDate = this.iterations.byVersionString[milestone]?.endDate;
      return endDate ? DateTime.fromISO(endDate) : null;
    };
    const getStartDate = milestone => {
      const startDate = this.iterations.byVersionString[milestone]?.startDate;
      return startDate ? DateTime.fromISO(startDate) : null;
    };

    let RELEASE_MILESTONES = [
      {
        label: "Bug Breakdown",
        calculate() {
          let prevRelease = Milestones.getPrevRelease(release);
          return getEndDate(`${prevRelease}.4`)?.plus({ days: -2 });
        },
      },
      {
        label: `${release}.1`,
        calculate() {
          return getStartDate(this.label);
        },
      },
      {
        label: "PI Request Due",
        calculate() {
          return getEndDate(`${release}.1`)?.plus({ days: -2 });
        },
      },
      {
        label: `${release}.2`,
        calculate() {
          return getStartDate(this.label);
        },
      },
      {
        label: "Tech Documentation Due",
        calculate() {
          return getEndDate(`${release}.2`)?.plus({ days: -2 });
        },
      },
      {
        label: `${release}.3`,
        calculate() {
          return getStartDate(this.label);
        },
      },
      {
        label: `${release}.4`,
        calculate() {
          return getStartDate(this.label);
        },
      },
      {
        label: "Feature Complete",
        calculate() {
          return getEndDate(`${release}.4`)?.plus({ weeks: -1, days: -2 });
        },
      },
      {
        label: "Nightly Code Freeze",
        calculate() {
          let endDate = getEndDate(`${release}.4`);
          return endDate ? getMondayBefore(endDate) : null;
        },
      },
      {
        label: "Merge Day",
        calculate() {
          const nextRelease = Milestones.getNextRelease(release);
          return getStartDate(`${nextRelease}.1`);
        },
      },
      {
        label: "Release Day",
        calculate() {
          const nextRelease = Milestones.getNextRelease(release);
          return getStartDate(`${nextRelease}.1`)?.plus({ days: 1 });
        },
      },
    ];

    return RELEASE_MILESTONES;
  }
}
