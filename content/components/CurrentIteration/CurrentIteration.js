import React from "react";
import ReactDOM from "react-dom";
import styles from "./CurrentIteration.scss";
import {BugList} from "../BugList/BugList";
import {getIteration} from "../../../lib/iterationUtils";
import {runQuery, AS_COMPONENTS} from "../../lib/utils";

const OPEN_BUG_URL = "https://bugzilla.mozilla.org/show_bug.cgi?id=";

// Calculates what percentage of bugs have been resolved so far
function getCompletionStats(bugs) {
  const completed = bugs.filter(bug => bug.status === "RESOLVED").length;
  const total = bugs.length;
  return {
    completed,
    total,
    percentage: Math.round(completed / total * 100)
  }
}

function getAssignedStats(bugs) {
  const openBugs = bugs.filter(bug => bug.status !== "RESOLVED");
  const total = openBugs.length;
  const assigned = openBugs.filter(bug => bug.assigned_to !== "nobody@mozilla.org").length;
  return {
    total,
    assigned,
    percentage: Math.round(assigned / total * 100)
  }
}

function timeToDays(t) {
  return Math.round(t / (60 * 60 * 24 * 1000));
}

// Renders a percentage bar
const CompletionBar = props => {
  if (!props.bugs || !props.bugs.length) {
    return null;
  }
  const stats = getCompletionStats(props.bugs);
  const assignedStats = getAssignedStats(props.bugs);

  const today = new Date().getTime();
  const start = new Date(props.start).getTime();
  const end = new Date(props.due).getTime();
  const totalDays = end - start;
  const daysLeft = end - today;
  const daysCompleted = totalDays - daysLeft;

  const timeElapsed = Math.round(daysCompleted / totalDays * 100);
  return <div className={styles.completionContainer}>
    <div className={styles.resolvedLabel}>{stats.completed}/{stats.total} resolved ({stats.percentage}%)</div>
    <div className={styles.assignedLabel}>{assignedStats.assigned}/{assignedStats.total} open bugs assigned ({assignedStats.percentage}%)</div>
    <div className={styles.completionBar}>
      <div className={styles.colorBar} style={{width: stats.percentage + "%"}} />
      <div className={styles.colorBar} style={{width: timeElapsed + "%", backgroundColor: "rgba(0,0,0,0.1)"}} />
    </div>
    <div>{timeToDays(daysLeft)}/{timeToDays(totalDays)} days left</div>
  </div>
}

// -1 = ascending
// 1 = descending
function sortBugsByField(bugs, getter, direction = -1) {
  return bugs.sort((a, b) => {
    if (getter(a) < getter(b)) {
      return direction;
    } else {
      return -direction;
    }
  });
}

// Renders a bug list
export class CurrentIteration extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      // sortField: "assignee",
      bugs: [],
      iteration: null,
      start: null,
      due: null
    };
    this.refresh = this.refresh.bind(this);
  }
  async refresh() {
    const {number, start, due} = getIteration();
    const bugs = await runQuery({
      include_fields: ["id", "summary", "assigned_to", "priority", "status"],
      component: AS_COMPONENTS,
      iteration: number
    });
    this.setState({bugs, iteration: number, start, due})
  }
  componentWillMount() {
    this.refresh();
  }
  sort(bugs) {
    return bugs.concat([]).sort((a, b) => {
      const m1 = a.assigned_to === this.props.bugzilla_email;
      const m2 = b.assigned_to === this.props.bugzilla_email;
      const a1 = a.assigned_to;
      const a2 = b.assigned_to;
      const r1 = a.status !== "RESOLVED";
      const r2 = b.status !== "RESOLVED";

      if (m1 && !m2) return -1;
      if (!m1 && m2) return 1;

      if (a1 < a2) return -1;
      if (a1 > a2) return 1;

      if (r1 && !r2) return -1;
      if (!r1 && r2) return 1;
      return 0;
    });
  }
  render() {
    const {state} = this;
    return (<div className={styles.container}>
      <h2 className={styles.title}>Current Iteration ({state.iteration})</h2>
      <CompletionBar bugs={state.bugs} start={state.start} due={state.due} />
      <BugList bugs={this.sort(state.bugs)} bugzilla_email={this.props.bugzilla_email} />
      {/* <button onClick={this.refresh}>Refresh</button> */}
    </div>);
  }
}
