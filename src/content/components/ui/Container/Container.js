import React, { useEffect } from "react";
import styles from "./Container.scss";
import gStyles from "../../../styles/gStyles.scss";
import { Loader } from "../../Loader/Loader";
import { FileNewBugButton } from "../FileNewBugButton/FileNewBugButton";

export const Container = props => {
  // Update the page's title for this container
  useEffect(() => {
    const prefix = `${
      typeof props.heading == "string" ? props.heading : props.title
    } – `;
    document.title = prefix + document.title;
    return () => (document.title = document.title.replace(prefix, ""));
  }, [props.heading, props.title]);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>
          {props.heading}{" "}
          {props.fileBug ? (
            <FileNewBugButton
              className={gStyles.headerButton}
              params={props.fileBug}
            />
          ) : (
            ""
          )}
        </h1>
        {props.subHeading ? (
          <p className={styles.subHeading}>{props.subHeading}</p>
        ) : (
          ""
        )}
      </header>

      {props.loaded ? props.children : <Loader />}
    </div>
  );
};
