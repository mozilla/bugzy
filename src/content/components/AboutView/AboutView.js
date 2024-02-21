import React from "react";
import * as styles from "./AboutView.module.scss";

export class AboutView extends React.PureComponent {
  render() {
    return (
      <div className={styles.container}>
        <h1>About</h1>
        Bugzy is a dashboard for tracking specific Bugzilla bugs. It&apos;s
        designed to be used by teams that want to track bugs in a specific
        iteration, or bugs that are blocking a specific bug.
        <p>
          <a
            href="https://github.com/mozilla/bugzy"
            target="_blank"
            rel="noopener noreferrer">
            Repository
          </a>
        </p>
        <p>
          <a
            href="https://github.com/mozilla/bugzy/issues/new/choose"
            target="_blank"
            rel="noopener noreferrer">
            Issues
          </a>
        </p>
        <h3>Credits</h3>
        <p>
          Icons are designed by{" "}
          <a
            href="https://smashicons.com/"
            target="_blank"
            rel="noopener noreferrer">
            Smashicons
          </a>
          ,{" "}
          <a
            href="https://www.freepik.com/"
            target="_blank"
            rel="noopener noreferrer">
            Freepik
          </a>
          , and{" "}
          <a
            href="https://roundicons.com/"
            target="_blank"
            rel="noopener noreferrer">
            Roundicons
          </a>{" "}
          from{" "}
          <a
            href="https://www.flaticon.com"
            target="_blank"
            rel="noopener noreferrer">
            flaticon.com
          </a>
        </p>
      </div>
    );
  }
}
