import React from "react";
import { GlobalContext } from "../GlobalContext/GlobalContext";
import { BugList } from "../BugList/BugList";
import { Container } from "../ui/Container/Container";
import { MiniLoader } from "../Loader/Loader";
import { BUGZILLA_TRIAGE_COMPONENTS } from "../../../config/project_settings";

const columns = ["id", "summary", "last_change_time", "priority"];
const displayColumns = [...columns, "cf_status_nightly", "cf_status_beta"];

export class Uplift extends React.PureComponent {
  static contextType = GlobalContext;

  constructor(props) {
    super(props);
    this.state = {
      loaded: false,
      awaitingNetwork: false,
      bugs: [],
    };
    this.fetchBugs = this.fetchBugs.bind(this);
    this.getFlagQuery = this.getFlagQuery.bind(this);
    this.getQueryFields = this.getQueryFields.bind(this);
    this.postQueryState = this.postQueryState.bind(this);
    this.getQueries = this.getQueries.bind(this);
  }

  async fetchBugs() {
    const result = await this.context.qm.runQueries(this.getQueries());
    this.postQueryState(
      result[3].bugs,
      result[1].bugs,
      result[2].bugs,
      result[3].bugs
    );
  }

  async componentWillMount() {
    this._isMounted = true;
    await this.context.qm.runCachedQueries(
      this.getQueries(),
      () => this._isMounted,
      ({
        rsp: [
          { bugs: upliftRequested },
          { bugs: upliftDenied },
          { bugs: upliftComplete },
          { bugs: tracking },
        ],
        awaitingNetwork,
      }) => {
        this.postQueryState(
          upliftRequested,
          upliftDenied,
          upliftComplete,
          tracking
        );
        this.setState({
          awaitingNetwork,
        });
      }
    );
  }

  getFlagQuery(type) {
    const prevRelease = this.props.prevRelease;

    return {
      include_fields: columns.concat(this.getQueryFields()),
      component: BUGZILLA_TRIAGE_COMPONENTS,
      target_milestone: ["---", `firefox ${prevRelease + 1}`],
      order: "changeddate DESC",
      custom: {
        "flagtypes.name": { substring: `approval-mozilla-beta${type}` },
      },
    };
  }

  getQueryFields() {
    const trackingField = `cf_tracking_firefox${this.props.prevRelease}`;
    const statusField = `cf_status_firefox${this.props.prevRelease}`;
    const statusNightly = `cf_status_firefox${this.props.release}`;
    return [trackingField, statusField, statusNightly];
  }

  postQueryState(upliftRequested, upliftDenied, upliftComplete, tracking) {
    this.setState({
      loaded: true,
      bugs: {
        tracking,
        upliftRequested,
        upliftApproved: upliftComplete.filter(
          b =>
            b.cf_tracking_beta === "+" &&
            !["verified", "fixed"].includes(b.cf_status_beta)
        ),
        upliftDenied: upliftDenied.filter(
          b =>
            b.cf_tracking_beta === "+" &&
            !["verified", "fixed"].includes(b.cf_status_beta)
        ),
        upliftComplete: upliftComplete.filter(
          b =>
            b.cf_tracking_beta === "+" &&
            ["verified", "fixed"].includes(b.cf_status_beta)
        ),
      },
    });
  }

  getQueries() {
    const betakey = `cf_tracking_firefox${this.props.prevRelease}`;
    return [
      this.getFlagQuery("?"),
      this.getFlagQuery("-"),
      this.getFlagQuery("+"),
      {
        include_fields: columns.concat(this.getQueryFields()),
        component: BUGZILLA_TRIAGE_COMPONENTS,
        order: "changeddate DESC",
        custom: {
          [betakey]: { anyexact: ["?", "+", "blocking"] },
          "flagtypes.name": { notsubstring: `approval-mozilla-beta` },
        },
      },
    ];
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  render() {
    return (
      <Container
        loaded={this.state.loaded}
        heading={`Uplift to Firefox ${this.props.prevRelease}`}>
        <h2>Tracking for uplift with no patch yet</h2>
        <p>
          These bugs have been flagged for uplift but do not have a request open
          on a patch.
        </p>
        <BugList
          bulkEdit={true}
          tags={true}
          bugs={this.state.bugs.tracking}
          columns={displayColumns}
          fetchBugs={this.fetchBugs}
        />

        <h2>Requested</h2>
        <p>These bugs have a request for uplift open on a patch.</p>
        <BugList
          bulkEdit={true}
          tags={true}
          bugs={this.state.bugs.upliftRequested}
          columns={displayColumns}
          fetchBugs={this.fetchBugs}
        />

        <h2>Denied</h2>
        <p>These bugs have a patch that was denied for uplift.</p>
        <BugList
          bulkEdit={true}
          tags={true}
          bugs={this.state.bugs.upliftDenied}
          columns={displayColumns}
          fetchBugs={this.fetchBugs}
        />

        <h2>Approved</h2>
        <p>These bugs have a patch that was approved for uplift.</p>
        <BugList
          bulkEdit={true}
          tags={true}
          bugs={this.state.bugs.upliftApproved}
          columns={displayColumns}
          fetchBugs={this.fetchBugs}
        />

        <h2>Landed</h2>
        <p>These bugs have been merged to beta.</p>
        <BugList
          bulkEdit={true}
          tags={true}
          bugs={this.state.bugs.upliftComplete}
          columns={displayColumns}
          fetchBugs={this.fetchBugs}
        />
        <MiniLoader hidden={!this.state.awaitingNetwork} />
      </Container>
    );
  }
}
