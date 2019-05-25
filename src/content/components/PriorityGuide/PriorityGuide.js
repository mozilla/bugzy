import React from "react";
import styles from "./PriorityGuide.scss";

export class PriorityGuide extends React.PureComponent {
  render() {
    return (
      <div className={styles.container}>
        <h2>Priority Guide</h2>

        <p>
          <strong className={styles.p1}>P1</strong> <strong>Current release</strong> required for
          the release currently in Firefox nightly or for uplift.
        </p>

        <p>
          <strong className={styles.p2}>P2</strong> <strong>Next release</strong> required for the
          next upcoming release.
        </p>

        <p>
          <strong className={styles.p3}>P3</strong> <strong>Backlog</strong> not required for the
          next two releases. Choose from this list if all other bugs are completed.
        </p>

        <p>
          <strong className={styles.p4}>P5</strong> <strong>Deprioritized</strong> valid but not
          important enough to be assigned to an iteration (although we would accept patches).
        </p>
      </div>
    );
  }
}
