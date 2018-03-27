import React from "react";
import styles from "./BugListView.scss";
import {BugList} from "../BugList/BugList";
import {runQuery, AS_COMPONENTS} from "../../lib/utils";

const columns = ["id", "summary", "last_change_time", "cf_fx_iteration"];

const BASE_QUERY = {
  include_fields: columns.concat(["whiteboard"])
};

export class BugListView extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {loaded: false, bugs: [], query: {}, uri: ""};
  }
  async componentWillMount() {
    const {bugs, query, uri} = await runQuery(Object.assign({}, BASE_QUERY, this.props.query));
    this.setState({loaded: true, bugs, query, uri});
  }
  renderLoading() {
    return (<div>Loading...</div>);
  }
  renderContent() {
    return (<React.Fragment>
      <BugList bulkEdit={true} tags={true} bugs={this.state.bugs} columns={columns} />

      <h3>Query</h3>
      <pre>{JSON.stringify(this.state.query, null, 2)}</pre>

      <h3>Bugzilla Search</h3>
      <p><a href={this.state.uri}>{this.state.uri}</a></p>
    </React.Fragment>);
  }
  render() {
    return (<div className={styles.container}>
      <h1>{this.props.title}</h1>
      {this.state.loaded ? this.renderContent() : this.renderLoading()}
    </div>);
  }
}
