import React from "react";
import styles from "./Container.scss";
import gStyles from "../../../styles/gStyles.scss";
import {Loader} from "../../Loader/Loader";
import {BUGZILLA_PRODUCT, FILE_NEW_BUGZILLA_COMPONENT} from "../../../../config/project_settings";

export const FileNewBugButton = props => {
  const url = `https://bugzilla.mozilla.org/enter_bug.cgi?${props.params}&product=${BUGZILLA_PRODUCT}&component=${FILE_NEW_BUGZILLA_COMPONENT}`;
  return <a target="_blank" rel="noopener noreferrer" className={`${gStyles.primaryButton} ${gStyles.headerButton}`} href={url}>File new bug</a>;
};

export const Container = props => (<div className={styles.container}>
  <header className={styles.header}>
    <h1>{props.heading} {props.fileBug ? <FileNewBugButton params={props.fileBug} /> : ""}</h1>
    {props.subHeading ? <p className={styles.subHeading}>{props.subHeading}</p> : ""}
  </header>

  {props.loaded ? props.children : <Loader />}
</div>);
