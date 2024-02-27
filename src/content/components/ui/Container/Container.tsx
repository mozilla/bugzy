import React, { useEffect, useCallback } from "react";
import * as styles from "./Container.module.scss";
import * as gStyles from "../../../styles/gStyles.module.scss";
import { Loader } from "../../Loader/Loader";
import { FileNewBugButton } from "../FileNewBugButton/FileNewBugButton";

export interface ContainerProps {
  heading?: string | React.ReactNode;
  title?: string;
  subHeading?: string | React.ReactNode;
  loaded: boolean;
  render?: () => React.ReactNode;
  children?: React.ReactNode;
  fileBug?: string;
}

export const Container: React.FunctionComponent<ContainerProps> = ({
  heading,
  title,
  subHeading,
  loaded,
  render,
  children,
  fileBug,
}) => {
  // Update the page's title for this container
  useEffect(() => {
    const prefix = `${typeof heading == "string" ? heading : title} – `;
    const originalTitle = document.title;
    document.title = prefix + document.title;
    return () => {
      document.title = originalTitle;
    };
  }, [heading, title]);

  const getContent = useCallback(() => {
    if (!loaded) {
      return <Loader />;
    }
    if (render) {
      return render();
    }
    return children;
  }, [loaded, children, render]);

  return (
    <div className={styles.container}>
      <header className={styles.heading}>
        <h1>
          {heading}{" "}
          {fileBug ? (
            <FileNewBugButton
              className={gStyles.headerButton}
              params={fileBug}
            />
          ) : (
            ""
          )}
        </h1>
        {subHeading ? <p className={styles.subHeading}>{subHeading}</p> : ""}
      </header>

      {getContent()}
    </div>
  );
};
