import React from "react";
import ReactDOM from "react-dom";
import styles from "./bugs.scss";
import {emails} from "./config/people";
const {ipcRenderer, shell} = window.require("electron");

const OPEN_BUG_URL = "https://bugzilla.mozilla.org/show_bug.cgi?id=";

function getBugClassName(bug) {
  const classNames = [];
  if (bug.status === "RESOLVED") classNames.push(styles.resolved);
  else if (bug.assigned_to === "khudson@mozilla.com") classNames.push(styles.mine);
  else if (bug.assigned_to === "nobody@mozilla.org") classNames.push(styles.unassigned);
  return classNames.join(" ");
}

function getShortName(email) {
  if (email === "nobody@mozilla.org") return "";
  return emails[email] || email;
}

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

const MESSAGE_CENTRE_META_BUG = 1432588;

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
class BugList extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      sortField: "assignee"
    };
    this.refresh = this.refresh.bind(this);
  }
  refresh() {
    this.setState({data: null});
    ipcRenderer.send("requestBugs", {id: "current_iteration", force: true});
  }
  async onLoad(nextProps, currentProps) {
    if (!currentProps || nextProps.id !== currentProps.id) {
      ipcRenderer.send("requestBugs", {id: "current_iteration", force: true});
    }
  }
  componentWillMount() {
    ipcRenderer.on("responseBugs", (ev, data) => {
      this.setState({data});
    });
    this.onLoad(this.props);
  }
  componentWillReceiveProps(nextProps) {
    this.onLoad(nextProps, this.props);
  }
  sort(bugs) {
    const field = this.state.sortField;
    if (!field) {
      return bugs;
    }
    let sortedBugs;
    switch (field) {
      case "assignee":
        sortedBugs = sortBugsByField(bugs, b => b.assigned_to.toLowerCase());
        break;
      case "priority":
        sortedBugs = sortBugsByField(bugs, b => b.priority);
        break;
    }
    return sortedBugs || bugs;
  }
  render() {
    const {data} = this.state;
    if (!data) return null;
    console.log(data);

    return (<div className={styles.container}>
      <h2 className={styles.title}>{data.title}</h2>
      <CompletionBar bugs={data.bugs} start={data.start} due={data.due} />
      <table className={styles.bugTable}>
        <thead>
          <tr>
            <th>Bug</th>
            <th>Description</th>
            <th onClick={() => this.setState({sortField: "assignee"})}>Assignee</th>
            <th onClick={() => this.setState({sortField: "priority"})}>Priority</th>
          </tr>
        </thead>
        <tbody>
          {this.sort(data.bugs).map(bug => (<tr key={bug.id} className={getBugClassName(bug)}>
            <td className={styles.bugNumber}><a href={OPEN_BUG_URL + bug.id}>{bug.id}</a></td>
            <td className={styles.bugSummary}>{bug.summary}</td>
            <td>{getShortName(bug.assigned_to)}</td>
            <td>{bug.priority}</td>
          </tr>))}
        </tbody>
      </table>
      <button onClick={this.refresh}>Refresh</button>
    </div>);
  }
}

const App = () => (<div>
  <BugList id="current_iteration" />
</div>);

ReactDOM.render(<App />, document.getElementById("root"));
