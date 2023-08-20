import React from "react";
import * as styles from "./BugListView.module.scss";
import * as gStyles from "../../styles/gStyles.module.scss";
import { GlobalContext } from "../GlobalContext/GlobalContext";
import { BugList } from "../BugList/BugList";
import { Loader, MiniLoader } from "../Loader/Loader";

export class BugListView extends React.PureComponent {
  static contextType = GlobalContext;

  constructor(props) {
    super(props);
    this.state = {
      loaded: false,
      awaitingNetwork: false,
      bugs: [],
      query: {},
      uri: "",
      showDebug: false,
    };
    this.toggleDebug = this.toggleDebug.bind(this);
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
      ]),
      resolution: ["---", "FIXED"],
    };
    await this.context.qm.runCachedQueries(
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
        <BugList
          compact={true}
          bulkEdit={true}
          tags={true}
          bugs={this.state.bugs}
          columns={this.props.columns}
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
  columns: ["id", "summary", "last_change_time", "cf_fx_iteration"],
};
