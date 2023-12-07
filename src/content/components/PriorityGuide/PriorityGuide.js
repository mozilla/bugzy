import React from "react";
import styles from "./PriorityGuide.scss";
import { prefs } from "../../lib/prefs";

export class PriorityGuide extends React.PureComponent {
  constructor(props) {
    super(props);
    this.onPrefChange = this.onPrefChange.bind(this);
    this.onToggleCollapse = this.onToggleCollapse.bind(this);
    this.state = {
      priorityGuideOpen: prefs.get("priority_guide_open"),
    };
    prefs.on("priority_guide_open", this.onPrefChange);
  }

  onPrefChange({ name, newValue } = {}) {
    if (name === "priority_guide_open") {
      this.setState({ priorityGuideOpen: newValue });
    }
  }

  onToggleCollapse() {
    prefs.set("priority_guide_open", !this.state.priorityGuideOpen);
  }

  render() {
    const priorityGuideOpen = this.state.priorityGuideOpen;
    return (
      <div>
        <div
          className={
            priorityGuideOpen ? styles.containerOpen : styles.containerClosed
          }>
          <div className={styles.innerBox}>
            <h2 className={styles.title}>Legend</h2>

            <div className={styles.scrollbox}>
              <h3>Priority</h3>

              <p>
                <strong className={styles.p1}>P1</strong>{" "}
                <strong>Current release</strong>: Required for the release
                currently in Firefox nightly or for uplift.
              </p>

              <p>
                <strong className={styles.p2}>P2</strong>{" "}
                <strong>Next release</strong>: Required for the next upcoming
                release.
              </p>

              <p>
                <strong className={styles.p3}>P3</strong>{" "}
                <strong>Backlog</strong>: Not required for the next two
                releases. Choose from this list if all other bugs are completed.
              </p>

              <p>
                <strong className={styles.p4}>P5</strong>{" "}
                <strong>Deprioritized</strong>: Valid but not important enough
                to be assigned to an iteration (although we would accept
                patches).
              </p>

              <h3>Severity</h3>

              <p>
                <strong className={styles.s1}>S1</strong>{" "}
                <strong>Catastrophic</strong>: Blocks development/testing, may
                impact more than 25% of users, causes data loss, likely dot
                release driver, and no workaround available.
              </p>

              <p>
                <strong className={styles.s2}>S2</strong>{" "}
                <strong>Serious</strong>: Major functionality/product severely
                impaired or a high impact issue and a satisfactory workaround
                does not exist.
              </p>

              <p>
                <strong className={styles.s3}>S3</strong>{" "}
                <strong>Normal</strong>: Blocks non-critical functionality and a
                work around exists.
              </p>

              <p>
                <strong className={styles.s4}>S4</strong>{" "}
                <strong>Trivial</strong>: Minor significance, cosmetic issues,
                low or no impact to users.
              </p>

              <p>
                <strong className={styles["n/a"]}>{"N/A"}</strong>{" "}
                <strong>Not Applicable</strong>: The above definitions do not
                apply. This value is reserved for Tasks and Enhancements.
              </p>

              <h3>Size</h3>

              <p>
                The points field is an estimate of the bug{"'"}s complexity and
                required effort. T-shirt sizes visualize the points.
              </p>

              <p>
                <strong className={styles.sm}>SM</strong> <strong>Small</strong>
                : 1 or 2 points
              </p>

              <p>
                <strong className={styles.md}>MD</strong>{" "}
                <strong>Medium</strong>: 3 or 5 points
              </p>

              <p>
                <strong className={styles.lg}>LG</strong> <strong>Large</strong>
                : 8 or 13 points
              </p>

              <p>
                <strong className={styles.xl}>XL</strong>{" "}
                <strong>Extra Large</strong>: 15 or more points
              </p>
            </div>
          </div>
        </div>
        <button
          className={styles.sidebarToggle}
          type="button"
          role="button"
          onClick={this.onToggleCollapse}>
          <span
            className={
              priorityGuideOpen ? styles.iconArrowhead : styles.iconOverflow
            }
          />
        </button>
      </div>
    );
  }
}
