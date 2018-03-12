import React from "react";
import ReactDOM from "react-dom";
import styles from "./CurrentIteration.scss";
import {BugList} from "../BugList/BugList";
import {getIteration} from "../../../lib/iterationUtils";
import {runQuery, AS_COMPONENTS} from "../../lib/utils";
const OPEN_BUG_URL = "https://bugzilla.mozilla.org/show_bug.cgi?id=";
import {CompletionBar} from "../CompletionBar/CompletionBar";

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
    const {number, start, due} = getIteration("2018-03-12");
    const bugs = await runQuery({
      include_fields: ["id", "summary", "assigned_to", "priority", "status", "whiteboard", "severity"],
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
      {state.start ? <CompletionBar bugs={state.bugs} startDate={state.start} endDate={state.due} /> : null}
      <BugList bulkEdit={true} bugs={this.sort(state.bugs)} bugzilla_email={this.props.bugzilla_email} />
      {/* <button onClick={this.refresh}>Refresh</button> */}
    </div>);
  }
}
