import React from "react";
import styles from "./BugList.scss";
import gStyles from "../../styles/gStyles.scss";
import {definitions} from "../../../schema/query_options";
import {columnTransforms} from "./columnTransforms";
import {isBugResolved} from "../../lib/utils";

function getDisplayName(id) {
  return definitions[id] ? definitions[id].displayName : id;
}

const EditorGroup = props => <div className={styles.editorGroup}>{props.children}</div>;

export class BugList extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      selectedBugs: {},
      showResolved: true
    };
    this.onCheck = this.onCheck.bind(this);
    this.onAllSelectedCheck = this.onAllSelectedCheck.bind(this);
    this.onCheckShowResolved = this.onCheckShowResolved.bind(this);
  }

  getRowClassName(bug) {
    const classNames = [];
    if (isBugResolved(bug)) {
      classNames.push(styles.resolved);
    } else if (bug.assigned_to === "nobody@mozilla.org") {
      classNames.push(styles.unassigned);
    } else if (this.props.bugzilla_email && bug.assigned_to === this.props.bugzilla_email) {
      classNames.push(styles.mine);
    }
    return classNames.join(" ");
  }

  renderColumn(columnId, bug) {
    const columnTransform = this.props.columnTransforms[columnId];
    const value = columnTransform ? columnTransform(bug[columnId], bug, this.props) : bug[columnId];
    return (<td className={`${styles.td} ${styles[`${columnId}Column`]}`} key={columnId}>{value}</td>);
  }

  onAllSelectedCheck(e) {
    if (e.target.checked) {
      const selectedBugs = {};
      this.filterResolved().forEach(bug => {
        selectedBugs[bug.id] = true;
      });
      this.setState({selectedBugs});
      return;
    }
    this.setState({selectedBugs: {}});
  }

  onCheck(e) {
    this.setState(prevState => {
      const newState = Object.assign({}, prevState.selectedBugs);
      if (e.target.checked) {
        newState[e.target.value] = true;
      } else {
        delete newState[e.target.value];
      }
      return {selectedBugs: newState};
    });
  }

  onCheckShowResolved(e) {
    this.setState({showResolved: e.target.checked});
  }

  getBulkEditLink(bugs) {
    return `https://bugzilla.mozilla.org/buglist.cgi?bug_id=${bugs.join(",")}&order=bug_id&tweak=1`;
  }

  renderFilters() {
    return (<EditorGroup>
      {this.props.showResolvedOption ? <span><input type="checkbox" onChange={this.onCheckShowResolved} checked={this.state.showResolved} /> Show Resolved</span> : null}
    </EditorGroup>);
  }

  renderBulkEdit(selectedBugs) {
    return (<EditorGroup>
      <a className={gStyles.primaryButton} href={this.getBulkEditLink(selectedBugs)}>Edit in Bugzilla</a>
    </EditorGroup>);

    /* <EditorGroup>
      <select>
        <option defualt>Feature</option>
        {features.map(f => <option key={f.id} value={f.id}>{f.displayName}</option>)}
      </select>
    </EditorGroup>
    <EditorGroup>
      <select>
        <option defualt>Release</option>
        <option value="60">60</option>
        <option value="61">61</option>
      </select>
    </EditorGroup>
    <EditorGroup>
      <select>
        <option defualt>Iteration</option>
        <option value="60.4">60.4</option>
        <option value="61.1">61.1</option>
      </select>
    </EditorGroup> */
  }

  filterResolved() {
    const {bugs} = this.props;
    if (this.state.showResolved) { return bugs; }
    return bugs.filter(bug => !isBugResolved(bug));
  }

  renderTable() {
    const {props} = this;
    const totalBugs = this.filterResolved();
    const selectedBugs = Object.keys(this.state.selectedBugs);
    return (<table className={styles.bugTable}>
      <thead>
        {props.showSummaryBar ? <tr className={styles.editor}>
          {this.props.bulkEdit ? <th className={`${styles.th} ${styles.bulkColumn}`}><input
            type="checkbox"
            value="all"
            checked={selectedBugs.length === totalBugs.length}
            onChange={this.onAllSelectedCheck} /></th> : null}
          <th className={styles.th} colSpan={props.columns.length}>
            <div className={styles.editorType}>
              <div className={styles.leftEditorGroup}>{selectedBugs.length ? `${selectedBugs.length} bugs selected` : `${totalBugs.length} bugs`}</div>
              <div>
                {selectedBugs.length ? this.renderBulkEdit(selectedBugs) : this.renderFilters()}
              </div>
            </div>
          </th>
        </tr> : null}
        <tr className={styles.labels}>
          {this.props.bulkEdit ? <th className={styles.th} /> : null}
          {props.columns.map(id => (<th className={styles.th} key={id}>{getDisplayName(id)}</th>))}
        </tr>
      </thead>
      <tbody>
        {totalBugs.map(bug => (<tr className={this.getRowClassName(bug)} key={bug.id}>
          {this.props.bulkEdit ? <td className={`${styles.td} ${styles.bulkColumn}`}>
            <input type="checkbox"
              value={bug.id}
              checked={!!this.state.selectedBugs[bug.id]}
              onChange={this.onCheck} />
          </td> : null}
          {props.columns.map(columnId => this.renderColumn(columnId, bug))}
        </tr>))}
      </tbody>
    </table>);
  }

  render() {
    const {props} = this;
    return (<div>
      {props.title ? <h3>{props.title}</h3> : null}
      {props.bugs.length ? this.renderTable() : <div className={styles.emptyState}>No bugs found.</div>}
    </div>);
  }
}

BugList.defaultProps = {
  bugs: [],
  columns: ["id", "summary", "assigned_to", "priority"],
  columnTransforms,
  tags: false,
  showSummaryBar: true,
  showResolvedOption: true
};
