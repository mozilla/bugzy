import React from "react";
import styles from "./BugList.scss";
import gStyles from "../../styles/gStyles.scss";
import { definitions } from "../../../schema/query_options";
import { columnTransforms } from "./columnTransforms";
import { isBugResolvedOrMerged } from "../../lib/utils";
import { FileNewBugButton } from "../ui/FileNewBugButton/FileNewBugButton";
import { GlobalContext } from "../GlobalContext/GlobalContext";
import { ITERATION_OVERRIDES } from "../../../common/IterationLookup";
import Select from "react-select";

const selectStyle = {
  control: provided => ({
    ...provided,
    minHeight: "27px",
    height: "27px",
    marginLeft: "10px",
  }),
  valueContainer: provided => ({
    ...provided,
    height: "27px",
    padding: "0 6px",
  }),
  input: provided => ({
    ...provided,
    margin: "0px",
  }),
  indicatorSeparator: () => ({
    display: "none",
  }),
  indicatorsContainer: provided => ({
    ...provided,
    height: "27px",
  }),
  menuList: provided => ({
    ...provided,
    color: "hsl(0, 0%, 20%)",
  }),
};

const iterationPickerStyle = Object.assign({}, selectStyle);
iterationPickerStyle.valueContainer = provided => ({
  ...provided,
  width: "160px",
});

function getDisplayName(id) {
  return definitions[id] ? definitions[id].displayName : id;
}

const EditorGroup = props => (
  <div className={styles.editorGroup}>{props.children}</div>
);

// TODO: convert to functional component and add scrolltoview for select
export class BugList extends React.PureComponent {
  static contextType = GlobalContext;

  constructor(props, context) {
    super(props);
    this.state = {
      selectedBugs: {},
      showResolved: props.showResolved,
      editSelection: -1,
      newPriority: "---",
      newIteration: context.iterations.getIteration().number,
      bugUpdating: false,
    };
    this.onCheck = this.onCheck.bind(this);
    this.onAllSelectedCheck = this.onAllSelectedCheck.bind(this);
    this.onCheckShowResolved = this.onCheckShowResolved.bind(this);
    this.onUpdateIterationSelect = this.onUpdateIterationSelect.bind(this);
    this.onUpdatePrioritySelect = this.onUpdatePrioritySelect.bind(this);
    this.updateIteration = this.updateIteration.bind(this);
    this.updatePriority = this.updatePriority.bind(this);
    this.onEditDropdownSelect = this.onEditDropdownSelect.bind(this);
    const currentIterationIndex = context.iterations.originalVersionStrings.indexOf(
      this.getCurrentIterationString(
        context.iterations.originalVersionStrings,
        context.iterations.getIteration().number
      )
    );
    this.iterationOptions = [
      ...context.iterations.originalVersionStrings
        .filter(iteration => !iteration.includes("."))
        .concat(
          context.iterations.originalVersionStrings
            .filter(iteration => iteration.includes("."))
            .slice(
              Math.max(1, currentIterationIndex - 51),
              Math.min(
                context.iterations.originalVersionStrings.length,
                currentIterationIndex + 52
              )
            )
        )
        .map(iteration => ({
          value: iteration,
          label: iteration,
        })),
    ];
    this.priorityOptions = [
      ...context.priorities.map(priority => ({
        value: priority,
        label: priority,
      })),
    ];
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      prevState.bugUpdating &&
      JSON.stringify(prevProps.bugs) != JSON.stringify(this.props.bugs)
    ) {
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState({
        bugUpdating: false,
        editSelection: -1,
        selectedBugs: {},
      });
    }
  }

  getCurrentIterationString(originalVersionStrings, currentIterationNumber) {
    const iterationsByRange = new Map();
    const rangesByIteration = new Map();
    const STARTING_VERSION = 67;
    // Remove duplicate date ranges (override in insertion order)
    for (const value of originalVersionStrings) {
      const match = value.match(/(\d+)\.(\d+) - (.*)/);
      if (match) {
        const version = parseInt(match[1], 10);
        // Ignore iterations before 67.1
        if (version < STARTING_VERSION) continue;
        const iterationString = `${match[1]}.${match[2]}`;
        iterationsByRange.set(match[3], iterationString);
      }
    }
    // Remove duplicate versions
    for (const [range, iteration] of iterationsByRange) {
      rangesByIteration.set(iteration, range);
    }
    // Add manual overrides
    for (const { iteration, range } of ITERATION_OVERRIDES) {
      if (range) {
        rangesByIteration.set(iteration, range);
      } else {
        rangesByIteration.delete(iteration);
      }
    }

    return `${currentIterationNumber} - ${rangesByIteration.get(
      currentIterationNumber
    )}`;
  }

  getDefaultIteration(selectedBug) {
    const iterationVersion =
      selectedBug != null &&
      "cf_fx_iteration" in selectedBug &&
      selectedBug.cf_fx_iteration != "---"
        ? selectedBug.cf_fx_iteration
        : null;

    const defaultIteration =
      selectedBug != null &&
      "cf_fx_iteration" in selectedBug &&
      selectedBug.cf_fx_iteration == "---"
        ? this.context.iterations.originalVersionStrings[
            this.context.iterations.originalVersionStrings.findIndex(
              iteration => iteration == iterationVersion
            ) + 1
          ]
        : this.getCurrentIterationString(
            this.context.iterations.originalVersionStrings,
            this.context.iterations.getIteration().number
          );
    return defaultIteration;
  }

  getDefaultPriority(selectedBug) {
    if (selectedBug == null) return "--";
    return selectedBug.priority == "--" ? "P1" : selectedBug.priority;
  }

  getRowClassName(bug) {
    const classNames = [];
    if (this.props.crossOutResolved && isBugResolvedOrMerged(bug)) {
      classNames.push(styles.resolved);
    } else if (bug.assigned_to === "nobody@mozilla.org") {
      classNames.push(styles.unassigned);
    } else if (
      this.props.bugzilla_email &&
      bug.assigned_to === this.props.bugzilla_email
    ) {
      classNames.push(styles.mine);
    }
    return classNames.join(" ");
  }

  renderColumn(columnId, bug) {
    const columnTransform =
      this.props.columnTransforms[columnId] || columnTransforms[columnId];
    const value = columnTransform
      ? columnTransform(bug[columnId], bug, this.props)
      : bug[columnId];
    return (
      <td
        className={`${styles.td} ${styles[`${columnId}Column`]}`}
        key={columnId}>
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
      this.setState({ selectedBugs });
      return;
    }
    this.setState({ selectedBugs: {}, editSelection: -1 });
  }

  onCheck(e) {
    const { checked, value } = e.target;
    this.setState(prevState => {
      const newSelectedBugs = Object.assign({}, prevState.selectedBugs);
      if (checked) {
        newSelectedBugs[value] = true;
      } else {
        delete newSelectedBugs[value];
      }

      let newEditSelection = prevState.editSelection;
      if (!Object.keys(newSelectedBugs).length) {
        newEditSelection = -1;
      }
      return { selectedBugs: newSelectedBugs, editSelection: newEditSelection };
    });
  }

  onCheckShowResolved(e) {
    this.setState({ showResolved: e.target.checked });
  }

  getBulkEditLink(bugs) {
    return `https://bugzilla.mozilla.org/buglist.cgi?bug_id=${bugs.join(
      ","
    )}&order=bug_id&tweak=1`;
  }

  renderFilters() {
    return (
      <div>
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
      </div>
    );
  }

  onEditDropdownSelect(selection) {
    const selectedBugs = this.state.selectedBugs;
    this.setState({ editSelection: selection.value });
    if (selection.value == 2) {
      window.open(this.getBulkEditLink(Object.keys(selectedBugs)));
    }

    if (Object.keys(selectedBugs).length == 1) {
      const selectedBug = this.props.bugs.find(
        bug => bug.id == parseInt(Object.keys(selectedBugs)[0])
      );

      if (selection.value == 0) {
        this.setState({ newIteration: this.getDefaultIteration(selectedBug) });
      } else if (selection.value == 1) {
        this.setState({ newPriority: this.getDefaultPriority(selectedBug) });
      }
    }
  }

  onUpdateIterationSelect(selection) {
    this.setState({ newIteration: selection.value });
  }

  onUpdatePrioritySelect(selection) {
    this.setState({ newPriority: selection.value });
  }

  updateBugs(ids, fields) {
    this.setState(prevState => {
      const newSelectedBugs = Object.assign({}, prevState.selectedBugs);
      for (let id in ids) {
        delete newSelectedBugs[id];
      }
      return { bugUpdating: true, selectedBugs: newSelectedBugs };
    });
    fields.ids = ids;

    fetch(`/api/bug/${ids[0]}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(fields),
    }).then(async () => {
      await this.props.fetchBugs();
    });
  }

  updateIteration(e) {
    this.updateBugs(Object.keys(this.state.selectedBugs), {
      cf_fx_iteration: this.state.newIteration,
    });
    e.preventDefault();
  }

  updatePriority(e) {
    this.updateBugs(Object.keys(this.state.selectedBugs), {
      priority: this.state.newPriority,
    });
    e.preventDefault();
  }

  renderBulkEdit(selectedBugs) {
    const editOptions = [
      {
        value: 0,
        label: "Edit Iteration",
      },
      {
        value: 1,
        label: "Edit Priority",
      },
      {
        value: 2,
        label: "Edit in Bugzilla",
      },
    ];

    const selectedBug =
      selectedBugs.length == 1
        ? this.props.bugs.find(bug => bug.id == parseInt(selectedBugs[0]))
        : null;
    const defaultIteration = this.getDefaultIteration(selectedBug);
    const defaultPriority = this.getDefaultPriority(selectedBug);

    return (
      <>
        {true || selectedBug != null ? (
          <>
            {false && selectedBugs.length > 1 ? (
              <React.Fragment>
                <EditorGroup>
                  <a
                    className={gStyles.primaryButton}
                    href={this.getBulkEditLink(selectedBugs)}>
                    Edit in Bugzilla
                  </a>
                </EditorGroup>
              </React.Fragment>
            ) : (
              <>
                {this.state.editSelection == 0 && (
                  <React.Fragment>
                    <Select
                      options={this.iterationOptions}
                      defaultValue={this.iterationOptions.find(
                        option => option.value == defaultIteration
                      )}
                      styles={iterationPickerStyle}
                      onChange={this.onUpdateIterationSelect}
                      isSearchable={true}
                    />
                    <input
                      type="button"
                      className={gStyles.primaryButton}
                      value="Update"
                      onClick={this.updateIteration}
                    />
                  </React.Fragment>
                )}
                {this.state.editSelection == 1 && (
                  <React.Fragment>
                    <Select
                      options={this.priorityOptions}
                      defaultValue={this.priorityOptions.find(
                        option => option.value == defaultPriority
                      )}
                      styles={selectStyle}
                      onChange={this.onUpdatePrioritySelect}
                    />
                    <input
                      type="button"
                      className={gStyles.primaryButton}
                      value="Update"
                      onClick={this.updatePriority}
                    />
                  </React.Fragment>
                )}
                <React.Fragment>
                  <Select
                    options={editOptions}
                    values={[]}
                    onChange={this.onEditDropdownSelect}
                    styles={selectStyle}
                    placeholder={"Edit Options"}
                  />
                </React.Fragment>
              </>
            )}
          </>
        ) : (
          <></>
        )}
      </>
    );
  }

  filterResolved() {
    const { bugs } = this.props;
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
        {this.state.bugUpdating ? (
          <>Updating bug...</>
        ) : (
          <>
            {selectedBugs.length
              ? this.renderBulkEdit(selectedBugs)
              : this.renderFilters()}
          </>
        )}
      </div>
    );
  }

  renderTable() {
    const { props } = this;
    const totalBugs = this.filterResolved();
    const selectedBugs = Object.keys(this.state.selectedBugs);

    return (
      <table className={styles.bugTable}>
        <thead>
          {props.showSummaryBar ? (
            <tr
              className={props.compact ? styles.editorCompact : styles.editor}>
              {this.props.bulkEdit ? (
                <th className={`${styles.th} ${styles.bulkColumn}`}>
                  <input
                    type="checkbox"
                    value="all"
                    checked={
                      totalBugs.length > 0 &&
                      selectedBugs.length === totalBugs.length
                    }
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
    const { props } = this;
    if (props.visibleIfEmpty || this.filterResolved().length) {
      return (
        <React.Fragment>
          {props.title ? <h3>{props.title}</h3> : null}
          {this.filterResolved().length || props.showHeaderIfEmpty ? (
            this.renderTable()
          ) : (
            <div className={styles.emptyState}>No bugs found.</div>
          )}
        </React.Fragment>
      );
    }
    return <></>;
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
  showResolved: true,
  visibleIfEmpty: true,
  fetchBugs: () => {},
};
