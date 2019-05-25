import React from "react";
import {Link} from "react-router-dom";
import styles from "./FeatureList.scss";
import gStyles from "../../styles/gStyles.scss";
import {getIteration} from "../../../common/iterationUtils";
import {isBugResolved} from "../../lib/utils";
import {
  BUGZILLA_PRODUCT,
  EPIC_BUG_NUMBER,
  FILE_NEW_BUGZILLA_COMPONENT,
} from "../../../config/project_settings";

const OPEN_BUG_URL = "https://bugzilla.mozilla.org/show_bug.cgi?id=";

export class FeatureList extends React.PureComponent {
  constructor(props) {
    super(props);
    this.metas = this.props.metas.sort((a, b) => {
      if (isBugResolved(a) && !isBugResolved(b)) {
        return 1;
      } else if (!isBugResolved(a) && isBugResolved(b)) {
        return -1;
      }
      return a.displayName.localeCompare(b.displayName);
    });
  }

  renderAddNewFeature() {
    const url = `https://bugzilla.mozilla.org/enter_bug.cgi?blocked=${EPIC_BUG_NUMBER}&product=${BUGZILLA_PRODUCT}&component=${FILE_NEW_BUGZILLA_COMPONENT}&keywords=meta`;
    return (
      <a
        target="_blank"
        rel="noopener noreferrer"
        className={`${gStyles.primaryButton} ${styles.headerButton}`}
        href={url}>
        Add new feature
      </a>
    );
  }

  renderTableHead(idLabel, featureLabel) {
    return (
      <thead>
        <tr className={styles.labels}>
          <th className={styles.idColumn}>{idLabel}</th>
          <th className={styles.displayNameColumn}>{featureLabel}</th>
        </tr>
      </thead>
    );
  }

  renderTableBody(bugs) {
    return (
      <tbody>
        {bugs.map(({id, displayName, status}) => (
          <tr className={isBugResolved({status}) ? styles.resolved : ""} key={id}>
            <td className={styles.idColumn}>
              <a target="_blank" href={OPEN_BUG_URL + id} rel="noopener noreferrer">
                {id}
              </a>
            </td>
            <td className={styles.displayNameColumn}>
              <Link to={`/feature/${id}`}>{displayName}</Link>
            </td>
          </tr>
        ))}
      </tbody>
    );
  }

  sortMetas(bugs) {
    const result = {
      now: [],
      next: [],
      backlog: [],
      resolved: [],
    };
    bugs.forEach(bug => {
      if (isBugResolved(bug)) {
        result.resolved.push(bug);
      } else if (bug.priority === "P1") {
        result.now.push(bug);
      } else if (bug.priority === "P2") {
        result.next.push(bug);
      } else {
        result.backlog.push(bug);
      }
    });
    return result;
  }

  render() {
    const release = Number(getIteration().number.split(".")[0]);
    const empty = this.metas.length === 0;
    const bugs = this.sortMetas(this.props.metas);

    return (
      <div className={styles.container}>
        <h1>Feature List {this.renderAddNewFeature()}</h1>
        <p className={styles.subheading}>
          Note: To add a feature to sidebar, set the priority of the meta bug to <strong>P1</strong>
          .<br />
          Setting your feature to <strong>P1</strong> will prioritize it for for the current release
          and <strong>P2</strong> for the next.
        </p>
        {!empty ? (
          <table className={styles.featureTable}>
            {this.renderTableHead("Meta Bug", `Prioritized for Firefox ${release}`)}
            {this.renderTableBody(bugs.now)}

            {this.renderTableHead("", `Prioritized for Firefox ${release + 1}`)}
            {this.renderTableBody(bugs.next)}

            {this.renderTableHead("", "Other features")}
            <tbody>
              <tr>
                <td className={styles.idColumn} />
                <td className={styles.displayNameColumn}>
                  {" "}
                  <Link to={"/no-feature"}>[No feature]</Link>
                </td>
              </tr>
            </tbody>
            {this.renderTableBody(bugs.backlog)}
            {this.renderTableBody(bugs.resolved)}
          </table>
        ) : (
          <div className={styles.emptyState}>No features found.</div>
        )}
      </div>
    );
  }
}
