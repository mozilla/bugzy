import React from "react";
import styles from "./PriorityGuide.scss";

export class PriorityGuide extends React.PureComponent {
  render() {
    return (<div className={styles.container}>
      <h2>Priority Guide</h2>

      <p><strong className={styles.p1}>P1</strong> <strong>In progress</strong> in the current iteration, assigned, and currently being worked on.</p>

      <p><strong className={styles.p2}>P2</strong> <strong>Next up</strong> required for the current release, but not yet being worked on.</p>

      <p><strong className={styles.p3}>P3</strong> <strong>Backlog</strong> not required for the current release. Choose from this list if all P2s are completed.</p>

      <p><strong className={styles.p4}>P4</strong> <strong>Deprioritized</strong> valid but not important enough to be assigned to an iteration (although we would accept patches).</p>
    </div>);
  }
}
