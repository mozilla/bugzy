import React from "react";
import {Link} from "react-router-dom";
import styles from "./FeatureList.scss";
import gStyles from "../../styles/gStyles.scss";
import {getIteration} from "../../../common/iterationUtils";
import {isBugResolved} from "../../lib/utils";
import {BUGZILLA_PRODUCT, EPIC_BUG_NUMBER, FILE_NEW_BUGZILLA_COMPONENT} from "../../../config/project_settings";

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
    const url = `https://bugzilla.mozilla.org/enter_bug.cgi?blocked=${EPIC_BUG_NUMBER}&product=${BUGZILLA_PRODUCT}&component=${FILE_NEW_BUGZILLA_COMPONENT}`;
    return <a target="_blank" rel="noopener noreferrer" className={`${gStyles.primaryButton} ${styles.headerButton}`} href={url}>Add new feature</a>;
  }

  renderTableHead(idLabel, featureLabel) {
    return (<thead>
      <tr className={styles.labels}>
        <th className={styles.idColumn}>{idLabel}</th>
        <th className={styles.displayNameColumn}>{featureLabel}</th>
      </tr>
    </thead>);
  }

  renderTableBody(bugs) {
    return (<tbody>
      {bugs.map(({id, displayName, status}) => (
        <tr className={isBugResolved({status}) ? styles.resolved : ""} key={id}>
          <td className={styles.idColumn}>
            <a target="_blank" href={OPEN_BUG_URL + id} rel="noopener noreferrer">{id}</a>
          </td>
          <td className={styles.displayNameColumn}>
            <Link to={`/feature/${id}`}>{displayName}</Link>
          </td>
        </tr>
      ))}
    </tbody>);
  }

  render() {
    const release = getIteration().number.split(".")[0];
    const prioritized = this.metas.filter(meta => meta.release === release);
    const other = this.metas.filter(meta => meta.release !== release);
    const empty = this.metas.length === 0;

    return (<div className={styles.container}>
      <h1>Feature List {this.renderAddNewFeature()}</h1>
      <p className={styles.subheading}>Note: To prioritize a feature for a particular release, set the iteration of the meta bug to an iteration in that release.</p>
      {!empty ? (<table className={styles.featureTable}>
        {this.renderTableHead("Meta Bug", `Prioritized for Firefox ${release}`)}
        {this.renderTableBody(prioritized)}
        {this.renderTableHead("", "Other features")}
        {this.renderTableBody(other)}
      </table>) : (<div className={styles.emptyState}>No features found.</div>)}
    </div>);
  }
}
