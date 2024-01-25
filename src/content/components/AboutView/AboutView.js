import React from "react";
import styles from "./AboutView.scss";

export class AboutView extends React.PureComponent {
  render() {
    return (
      <div className={styles.container}>
        <h1>About</h1>
        <p>
          Please file issues at{" "}
          <a
            href="https://github.com/mozilla/bugzy/issues/new/choose"
            target="_blank"
            rel="noopener noreferrer">
            github.com/mozilla/bugzy
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
