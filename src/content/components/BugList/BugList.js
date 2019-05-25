import React from "react";
import styles from "./BugList.scss";
import gStyles from "../../styles/gStyles.scss";
import {definitions} from "../../../schema/query_options";
import {columnTransforms} from "./columnTransforms";
import {isBugResolvedOrMerged} from "../../lib/utils";
import {FileNewBugButton} from "../ui/FileNewBugButton/FileNewBugButton";

function getDisplayName(id) {
  return definitions[id] ? definitions[id].displayName : id;
}

const EditorGroup = props => <div className={styles.editorGroup}>{props.children}</div>;

export class BugList extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      selectedBugs: {},
      showResolved: true,
    };
    this.onCheck = this.onCheck.bind(this);
    this.onAllSelectedCheck = this.onAllSelectedCheck.bind(this);
    this.onCheckShowResolved = this.onCheckShowResolved.bind(this);
  }

  getRowClassName(bug) {
    const classNames = [];
    if (this.props.crossOutResolved && isBugResolvedOrMerged(bug)) {
      classNames.push(styles.resolved);
    } else if (bug.assigned_to === "nobody@mozilla.org") {
      classNames.push(styles.unassigned);
    } else if (this.props.bugzilla_email && bug.assigned_to === this.props.bugzilla_email) {
      classNames.push(styles.mine);
    }
    return classNames.join(" ");
  }

  renderColumn(columnId, bug) {
    const columnTransform = this.props.columnTransforms[columnId] || columnTransforms[columnId];
    const value = columnTransform ? columnTransform(bug[columnId], bug, this.props) : bug[columnId];
    return (
      <td className={`${styles.td} ${styles[`${columnId}Column`]}`} key={columnId}>
        {value}
      </td>
    );
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
    const {checked, value} = e.target;
    this.setState(prevState => {
      const newState = Object.assign({}, prevState.selectedBugs);
      if (checked) {
        newState[value] = true;
      } else {
        delete newState[value];
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
    return (
      <EditorGroup>
        {this.props.showResolvedOption ? (
          <span>
            <input
              type="checkbox"
              onChange={this.onCheckShowResolved}
              checked={this.state.showResolved}
            />{" "}
            Show Resolved
          </span>
        ) : null}
      </EditorGroup>
    );
  }

  renderBulkEdit(selectedBugs) {
    return (
      <React.Fragment>
        <EditorGroup>
          <a className={gStyles.primaryButton} href={this.getBulkEditLink(selectedBugs)}>
            Edit in Bugzilla
          </a>
        </EditorGroup>
      </React.Fragment>
    );
  }

  filterResolved() {
    const {bugs} = this.props;
    if (this.state.showResolved) {
      return bugs;
    }
    return bugs.filter(bug => !isBugResolvedOrMerged(bug));
  }

  _renderSubtitle() {
    return (
      <span>
        <strong>
          {this.props.meta ? (
            <a
              className={gStyles.plainLink}
              href={`https://bugzilla.mozilla.org/show_bug.cgi?id=${this.props.meta}`}>
              {this.props.subtitle} - Bug {this.props.meta}
            </a>
          ) : (
            this.props.subtitle
          )}
        </strong>{" "}
        |{" "}
      </span>
    );
  }

  _renderSectionBugSelection(selectedBugs, totalBugs) {
    return (
      <div className={styles.editorType}>
        <div className={styles.leftEditorGroup}>
          {this.props.subtitle ? this._renderSubtitle() : null}
          {selectedBugs.length
            ? `${selectedBugs.length} bugs selected`
            : `${totalBugs.length} bugs`}
          {this.props.fileNew ? (
            <span>
              {" "}
              | <FileNewBugButton unstyled={true} params={this.props.fileNew} />
            </span>
          ) : null}
        </div>
        <div>{selectedBugs.length ? this.renderBulkEdit(selectedBugs) : this.renderFilters()}</div>
      </div>
    );
  }

  renderTable() {
    const {props} = this;
    const totalBugs = this.filterResolved();
    const selectedBugs = Object.keys(this.state.selectedBugs);
    return (
      <table className={styles.bugTable}>
        <thead>
          {props.showSummaryBar ? (
            <tr className={props.compact ? styles.editorCompact : styles.editor}>
              {this.props.bulkEdit ? (
                <th className={`${styles.th} ${styles.bulkColumn}`}>
                  <input
                    type="checkbox"
                    value="all"
                    checked={totalBugs.length > 0 && selectedBugs.length === totalBugs.length}
                    onChange={this.onAllSelectedCheck}
                  />
                </th>
              ) : null}
              <th className={styles.th} colSpan={props.columns.length}>
                {this._renderSectionBugSelection(selectedBugs, totalBugs)}
              </th>
            </tr>
          ) : null}
          <tr className={styles.labels}>
            {this.props.bulkEdit ? <th className={styles.th} /> : null}
            {props.columns.map(id => (
              <th className={styles.th} key={id}>
                {getDisplayName(id)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {totalBugs.map(bug => (
            <tr className={this.getRowClassName(bug)} key={bug.id}>
              {this.props.bulkEdit ? (
                <td className={`${styles.td} ${styles.bulkColumn}`}>
                  <input
                    type="checkbox"
                    value={bug.id}
                    data-bug-id={bug.id}
                    checked={!!this.state.selectedBugs[bug.id]}
                    onChange={this.onCheck}
                  />
                </td>
              ) : null}
              {props.columns.map(columnId => this.renderColumn(columnId, bug))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  render() {
    const {props} = this;
    return (
      <React.Fragment>
        {props.title ? <h3>{props.title}</h3> : null}
        {props.bugs.length || props.showHeaderIfEmpty ? (
          this.renderTable()
        ) : (
          <div className={styles.emptyState}>No bugs found.</div>
        )}
      </React.Fragment>
    );
  }
}

BugList.defaultProps = {
  bugs: [],
  columns: ["id", "summary", "assigned_to", "priority", "status"],
  columnTransforms,
  tags: false,
  showHeaderIfEmpty: false,
  showSummaryBar: true,
  showResolvedOption: true,
  crossOutResolved: true,
};
