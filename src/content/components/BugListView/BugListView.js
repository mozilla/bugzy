import React from "react";
import styles from "./BugListView.scss";
import gStyles from "../../styles/gStyles.scss";
import { BugList, BugListFilters } from "../BugList/BugList";
import { Loader, MiniLoader } from "../Loader/Loader";
import { runCachedQueries } from "../../lib/utils";

export class BugListView extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      loaded: false,
      awaitingNetwork: false,
      bugs: [],
      query: {},
      uri: "",
      showDebug: false,
      showResolved: true,
      showAbandoned: false,
    };
    this.toggleDebug = this.toggleDebug.bind(this);
    this.onCheckShowResolved = this.onCheckShowResolved.bind(this);
    this.onCheckShowAbandoned = this.onCheckShowAbandoned.bind(this);
  }

  async componentWillMount() {
    this._isMounted = true;
    const BASE_QUERY = {
      include_fields: this.props.columns.concat([
        "whiteboard",
        "keywords",
        "type",
        "resolution",
        "status",
        "attachments",
      ]),
      resolution: ["---", "FIXED"],
    };
    await runCachedQueries(
      Object.assign({}, BASE_QUERY, this.props.query),
      () => this._isMounted,
      ({ rsp: { bugs, query, uri }, awaitingNetwork }) =>
        this.setState({
          loaded: true,
          awaitingNetwork,
          bugs: this.props.sort ? bugs.sort(this.props.sort) : bugs,
          query,
          uri,
        })
    );
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  toggleDebug() {
    this.setState(prevState => ({ showDebug: !prevState.showDebug }));
  }

  onCheckShowResolved(e) {
    this.setState({ showResolved: e.target.checked });
  }

  onCheckShowAbandoned(e) {
    this.setState({ showAbandoned: e.target.checked });
  }

  renderDebug() {
    return (
      <React.Fragment>
        <pre className={gStyles.codeSnippet}>
          {JSON.stringify(this.state.query, null, 2)}
        </pre>

        <h3>Bugzilla Search</h3>
        <p>
          <a href={this.state.uri}>{this.state.uri}</a>
        </p>
      </React.Fragment>
    );
  }

  renderContent() {
    return (
      <React.Fragment>
        <div>
          <BugListFilters
            showResolved={this.state.showResolved}
            showAbandoned={this.state.showAbandoned}
            toggleResolved={this.onCheckShowResolved}
            toggleAbandoned={this.onCheckShowAbandoned}
          />
        </div>
        <BugList
          compact={true}
          bulkEdit={true}
          tags={true}
          bugs={this.state.bugs}
          columns={this.props.columns}
          showResolved={this.state.showResolved}
          showAbandoned={this.state.showAbandoned}
        />
        <p>
          <button className={gStyles.primaryButton} onClick={this.toggleDebug}>
            {this.state.showDebug ? "Hide" : "Show"} Query
          </button>
        </p>
        <MiniLoader hidden={!this.state.awaitingNetwork} />
        {this.state.showDebug ? this.renderDebug() : null}
      </React.Fragment>
    );
  }

  render() {
    return (
      <div className={styles.container}>
        <h1>{this.props.title}</h1>
        {this.props.description ? (
          <p className={styles.description}>{this.props.description}</p>
        ) : null}
        {this.state.loaded ? this.renderContent() : <Loader />}
      </div>
    );
  }
}

BugListView.defaultProps = {
  columns: [
    "id",
    "summary",
    "last_change_time",
    "cf_fx_iteration",
    "phabIds",
    "reviewers",
  ],
};
