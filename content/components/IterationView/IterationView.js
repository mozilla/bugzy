import React from "react";
import ReactDOM from "react-dom";
import styles from "./IterationView.scss";
import {BugList} from "../BugList/BugList";
import {Loader} from "../Loader/Loader";
import {getIteration} from "../../../lib/iterationUtils";
import {runQuery, isBugResolved, AS_COMPONENTS} from "../../lib/utils";
const OPEN_BUG_URL = "https://bugzilla.mozilla.org/show_bug.cgi?id=";
import {CompletionBar} from "../CompletionBar/CompletionBar";
import {prefs} from "../../lib/prefs";

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

export class IterationView extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      prevIteration: null,
      bugzilla_email: null,
      loaded: true,
      bugs: [],
      iteration: null,
      start: null,
      due: null,
    };
  }
  async getBugs() {
    const {props} = this;
    const newState = {
      bugzilla_email: prefs.get("bugzilla_email")
    };

    let {iteration} = props.match.params;
    if (!iteration) {
      const {number, start, due} = getIteration(props.match.params.iteration);
      iteration = number;
      newState.start = start;
      newState.due = due;
    }

    const {bugs} = await runQuery({
      include_fields: ["id", "summary", "assigned_to", "priority", "status", "whiteboard", "keywords", "severity"],
      component: AS_COMPONENTS,
      iteration
      // TODO: There are perf issues with this right now
      // hasPR: true
    });

    // Check if the iteration has already changed
    if (this.props.match.params.iteration !== iteration) {
      return;
    }

    newState.loaded = true;
    newState.bugs = bugs;
    newState.iteration = iteration;
    this.setState(newState);
  }
  static getDerivedStateFromProps(nextProps, prevState) {
    if (prevState.iteration !== nextProps.iteration) {
      return {loaded: false, iteration: nextProps.iteration};
    }
    return null;
  }
  componentDidMount() {
    this.getBugs();
  }
  componentDidUpdate(prevProps, prevState) {
    if (this.state.loaded === false) {
      this.getBugs();
    }
  }
  sort(bugs) {
    return bugs.concat([]).sort((a, b) => {
      const m1 = a.assigned_to === this.state.bugzilla_email;
      const m2 = b.assigned_to === this.state.bugzilla_email;
      const a1 = a.assigned_to;
      const a2 = b.assigned_to;
      const r1 = !isBugResolved(a);
      const r2 = !isBugResolved(b);

      if (m1 && !m2) return -1;
      if (!m1 && m2) return 1;

      if (a1 < a2) return -1;
      if (a1 > a2) return 1;

      if (r1 && !r2) return -1;
      if (!r1 && r2) return 1;
      return 0;
    });
  }
  renderContent() {
    const {props, state} = this;
    const isCurrent = !!state.start;
    const title = `${isCurrent ? "Current " : ""}Iteration`;

    return (<React.Fragment>
      <h1 className={isCurrent ? styles.title : ""}>{title} ({state.iteration})</h1>
      {isCurrent ? <CompletionBar bugs={state.bugs} startDate={state.start} endDate={state.due} /> : null}
      <BugList tags bulkEdit={true} bugs={this.sort(state.bugs)} bugzilla_email={this.state.bugzilla_email} />
    </React.Fragment>);
  }
  render() {
    const {state} = this;
    return (<div className={styles.container}>
      {state.loaded ? this.renderContent() : <Loader />}
    </div>);
  }
}
