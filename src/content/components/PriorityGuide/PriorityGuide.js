import React from "react";
import styles from "./PriorityGuide.scss";

export class PriorityGuide extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {priorityGuideCollapsed: false};
    this.onToggleCollapse = this.onToggleCollapse.bind(this);
  }

  onToggleCollapse() {
    this.setState(prevState => ({priorityGuideCollapsed: !prevState.priorityGuideCollapsed}));
  }

  render() {
    const priorityGuideCollapsed = this.state.priorityGuideCollapsed;
    return (
      <div>
        <div className={styles.container}>
          <div className={priorityGuideCollapsed ? styles.inactive : styles.active} >
            <h2>Priority Guide</h2>

            <p><strong className={styles.p1}>P1</strong> <strong>Current release</strong> required for the release currently in Firefox nightly or for uplift.</p>

            <p><strong className={styles.p2}>P2</strong> <strong>Next release</strong> required for the next upcoming release.</p>

            <p><strong className={styles.p3}>P3</strong> <strong>Backlog</strong> not required for the next two releases. Choose from this list if all other bugs are completed.</p>

            <p><strong className={styles.p4}>P5</strong> <strong>Deprioritized</strong> valid but not important enough to be assigned to an iteration (although we would accept patches).</p>
          </div>
        </div>
        <button className={styles.sidebarToggle} type="button" role="button" onClick={this.onToggleCollapse} >
          <span className={priorityGuideCollapsed ? styles.iconOverflow : styles.iconArrowhead} />
        </button>
      </div>
    );
  }
}
