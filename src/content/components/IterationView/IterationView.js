import React from "react";
import styles from "./IterationView.scss";
import {BugList} from "../BugList/BugList";
import {Loader} from "../Loader/Loader";
import {getIteration} from "../../../common/iterationUtils";
import {isBugResolvedOrMerged, runQuery} from "../../lib/utils";
// const OPEN_BUG_URL = "https://bugzilla.mozilla.org/show_bug.cgi?id=";
import {CompletionBar} from "../CompletionBar/CompletionBar";
import {prefs} from "../../lib/prefs";
import {BUGZILLA_TRIAGE_COMPONENTS, PROJECT_NAME} from "../../../config/project_settings";

const QUERY_EXPLAINTAION = `All bugs in this iteration that are (a) blocking an ${PROJECT_NAME} meta bug or (b) in an ${PROJECT_NAME} component`;
const getQuery = props => ({
  include_fields: [
    "id",
    "summary",
    "assigned_to",
    "priority",
    "status",
    "whiteboard",
    "keywords",
    "type",
    "flags",
    "blocks",
  ],
  rules: [
    {key: "cf_fx_iteration", operator: "substring", value: props.iteration},
    {
      operator: "OR",
      rules: [
        {
          key: "blocked",
          operator: "anywordssubstr",
          value: props.metas.map(m => m.id).join(","),
        },
        {
          key: "component",
          operator: "anyexact",
          value: BUGZILLA_TRIAGE_COMPONENTS.join(","),
        },
      ],
    },
  ],
});

// -1 = ascending
// 1 = descending
// function sortBugsByField(bugs, getter, direction = -1) {
//   return bugs.sort((a, b) => {
//     if (getter(a) < getter(b)) {
//       return direction;
//     }
//     return -direction;
//   });
// }

export class IterationView extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      prevIteration: null,
      bugzilla_email: null,
      loaded: true,
      bugs: [],
      bugsByMeta: {},
      iteration: null,
      start: null,
      due: null,
    };
  }

  async getBugs() {
    const {props} = this;
    const newState = {
      bugzilla_email: prefs.get("bugzilla_email"),
      bugsByMeta: {},
    };

    let {iteration} = props;

    const {number, start, due} = getIteration();
    if (number === iteration) {
      newState.start = start;
      newState.due = due;
    }

    const result = await runQuery(getQuery(props));
    const {bugs} = result;

    // Check if the iteration has already changed
    if (props.iteration !== iteration) {
      return;
    }

    bugs.forEach(bug => {
      const metas = props.metas.filter(
        meta => meta.priority === "P1" && bug.blocks.includes(meta.id)
      );
      if (!metas.length) {
        metas.push({id: "other", displayName: "Other"});
      }
      metas.forEach(meta => {
        if (!newState.bugsByMeta[meta.id]) {
          newState.bugsByMeta[meta.id] = {meta, bugs: []};
        }
        newState.bugsByMeta[meta.id].bugs.push(bug);
      });
    });

    newState.loaded = true;
    newState.bugs = bugs;
    newState.iteration = iteration;
    this.setState(newState);
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    if (prevState.iteration !== nextProps.iteration) {
      return {
        loaded: false,
        start: null,
        due: null,
        bugs: [],
        bugsByMeta: {},
        iteration: nextProps.iteration,
      };
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
      const r1 = !isBugResolvedOrMerged(a);
      const r2 = !isBugResolvedOrMerged(b);

      if (m1 && !m2) {
        return -1;
      }
      if (!m1 && m2) {
        return 1;
      }

      if (a1 < a2) {
        return -1;
      }
      if (a1 > a2) {
        return 1;
      }

      if (r1 && !r2) {
        return -1;
      }
      if (!r1 && r2) {
        return 1;
      }
      return 0;
    });
  }

  renderBugList(meta, bugs) {
    return (
      <BugList
        key={meta.id}
        compact={true}
        subtitle={meta.displayName}
        tags={true}
        bulkEdit={true}
        bugs={this.sort(bugs)}
        bugzilla_email={this.state.bugzilla_email}
      />
    );
  }

  renderContent() {
    const {state} = this;
    const isCurrent = !!state.start;
    const title = `${isCurrent ? "Current " : ""}Iteration`;

    return (
      <React.Fragment>
        <div className={styles.topContainer}>
          <h1 className={styles.title}>
            {title} ({state.iteration})
          </h1>
          <p className={styles.description}>{QUERY_EXPLAINTAION}</p>
          {isCurrent ? (
            <CompletionBar bugs={state.bugs} startDate={state.start} endDate={state.due} />
          ) : null}
        </div>
        {Object.keys(state.bugsByMeta).map(id =>
          this.renderBugList(state.bugsByMeta[id].meta, state.bugsByMeta[id].bugs)
        )}
      </React.Fragment>
    );
  }

  render() {
    const {state} = this;
    return (
      <div className={styles.container}>{state.loaded ? this.renderContent() : <Loader />}</div>
    );
  }
}
