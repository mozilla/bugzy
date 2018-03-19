import React from "react";
import styles from "./BugList.scss";
import {definitions} from "../../../schema/query_options";
import features from "../../../config/metas";
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
    if (isBugResolved(bug)) classNames.push(styles.resolved);
    else if (bug.assigned_to === "nobody@mozilla.org") classNames.push(styles.unassigned);
    else if (this.props.bugzilla_email && bug.assigned_to === this.props.bugzilla_email) classNames.push(styles.mine);
    return classNames.join(" ");
  }
  renderColumn(columnId, bug) {
    const columnTransform = this.props.columnTransforms[columnId];
    const value = columnTransform ? columnTransform(bug[columnId], bug, this.props) : bug[columnId];
    return (<td className={styles[columnId + "Column"]} key={columnId}>{value}</td>);
  }
  onAllSelectedCheck(e) {
    if (e.target.checked) {
      const selectedBugs = {};
      this.props.bugs.forEach(bug => {
        selectedBugs[bug.id] = true;
      });
      this.setState({selectedBugs});
      return;
    } else {
      this.setState({selectedBugs: {}});
    }
  }
  onCheck(e) {
    const newState = Object.assign({}, this.state.selectedBugs);
    if (e.target.checked) {
      newState[e.target.value] = true;
    } else {
      delete newState[e.target.value];
    }
    this.setState({selectedBugs: newState});
  }
  onCheckShowResolved(e) {
    this.setState({showResolved: e.target.checked});
  }
  getBulkEditLink(bugs) {
    return `https://bugzilla.mozilla.org/buglist.cgi?bug_id=${bugs.join(",")}&order=bug_id&tweak=1`;
  }
  renderFilters() {
    return <React.Fragment>
      {this.props.bugs.length} bugs
      <div className={styles.rightEditorGroup}>
        <EditorGroup><input type="checkbox" onChange={this.onCheckShowResolved} checked={this.state.showResolved}/> Show Resolved</EditorGroup>
      </div>
    </React.Fragment>;
  }
  renderBulkEdit(selectedBugs) {
    return <React.Fragment>
      {selectedBugs.length} bugs selected
      <div className={styles.rightEditorGroup}>
        <EditorGroup>
          <a className={styles.bulkEditButton} href={this.getBulkEditLink(selectedBugs)}>Edit in Bugzilla</a>
        </EditorGroup>
        {/* <EditorGroup>
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
        </EditorGroup> */}
      </div>
    </React.Fragment>;
  }
  filterResolved(bugs) {
    if (this.state.showResolved) return bugs;
    return bugs.filter(bug => !isBugResolved(bug));
  }
  render() {
    const {props} = this;
    if (!props.bugs.length) {
      return <div>[Empty]</div>;
    }
    const selectedBugs = Object.keys(this.state.selectedBugs);
    return (<div>
      <table className={styles.bugTable}>
        <thead>
          <tr className={styles.editor}>
            {this.props.bulkEdit ? <th className={styles.bulkColumn}><input
              type="checkbox"
              value="all"
              checked={selectedBugs.length === props.bugs.length}
              onChange={this.onAllSelectedCheck} /></th> : null}
            <th colSpan={props.columns.length}>
              <div className={styles.editorType}>
                {selectedBugs.length ? this.renderBulkEdit(selectedBugs) : this.renderFilters()}
              </div>
            </th>
          </tr>
          <tr className={styles.labels}>
          {this.props.bulkEdit ? <th /> : null}
            {props.columns.map(id => {
              return(<th key={id}>{getDisplayName(id)}</th>)
            })}
          </tr>
        </thead>
        <tbody>
          {this.filterResolved(props.bugs).map(bug => (<tr className={this.getRowClassName(bug)} key={bug.id}>
            {this.props.bulkEdit ? <td className={styles.bulkColumn}>
              <input type="checkbox"
                value={bug.id}
                checked={!!this.state.selectedBugs[bug.id]}
                onChange={this.onCheck} />
            </td> : null}
            {props.columns.map(columnId => this.renderColumn(columnId, bug))}
          </tr>))}
        </tbody>
      </table>
    </div>);
  }
}

BugList.defaultProps = {
  bugs: [],
  columns: ["id", "summary", "assigned_to", "priority"],
  columnTransforms,
  tags: false
};
