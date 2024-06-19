import React from "react";
import { GlobalContext } from "../GlobalContext/GlobalContext";
import { BugList } from "../BugList/BugList";
import { MiniLoader } from "../Loader/Loader";
import { Container } from "../ui/Container/Container";

export class BugListView extends React.PureComponent {
  static contextType = GlobalContext;
  static defaultProps = {
    columns: ["id", "summary", "last_change_time", "cf_fx_iteration"],
  };

  constructor(props) {
    super(props);
    this.state = {
      loaded: false,
      awaitingNetwork: false,
      bugs: [],
      query: {},
      uri: "",
    };
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
        "component",
      ]),
      resolution: ["---", "FIXED"],
    };
    await this.context.qm.runCachedQueries(
      Object.assign({}, BASE_QUERY, this.props.query),
      () => this._isMounted,
      ({ rsp: { bugs, query, uri }, awaitingNetwork }) => {
        if (this.props.map) {
          bugs = bugs.map(this.props.map);
        }
        if (this.props.filter) {
          bugs = bugs.filter(this.props.filter);
        }
        if (this.props.sort) {
          bugs.sort(this.props.sort);
        }
        return this.setState({
          loaded: true,
          awaitingNetwork,
          bugs,
          query,
          uri,
        });
      }
    );
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  render() {
    return (
      <Container
        loaded={this.state.loaded}
        heading={this.props.title}
        subHeading={this.props.description}>
        <BugList
          compact={true}
          bulkEdit={true}
          tags={true}
          bugs={this.state.bugs}
          columns={this.props.columns}
          getBugWarning={this.props.getBugWarning}
        />
        <MiniLoader hidden={!this.state.awaitingNetwork} />
      </Container>
    );
  }
}
