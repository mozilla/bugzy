import React from "react";
import { GlobalContext } from "../GlobalContext/GlobalContext";
import { BugList } from "../BugList/BugList";
import { MiniLoader } from "../Loader/Loader";
import { BUGZILLA_GENERAL_TRIAGE_COMPONENTS } from "../../../config/project_settings";
import { Container } from "../ui/Container/Container";

const generalTriageColumns = [
  "id",
  "type",
  "summary",
  "last_change_time",
  "priority",
  "severity",
];
const triageNeededColumns = [
  "id",
  "type",
  "summary",
  "last_change_time",
  "priority",
];
const unassignedColumns = triageNeededColumns;

const includeFields = generalTriageColumns.concat([
  "assigned_to",
  "component",
  "creation_time",
  "creator",
  "flags",
  "groups",
  "keywords",
  "triage_owner",
]);

const generalTriageComponentsRule = {
  operator: "OR",
  rules: BUGZILLA_GENERAL_TRIAGE_COMPONENTS.map(({ product, component }) => ({
    rules: [
      { key: "product", operator: "equals", value: product },
      { key: "component", operator: "equals", value: component },
    ],
  })),
};

function addNeedinfoDetails(bug, ni) {
  bug.needinfo_nick = ni.requestee.split("@")[0];
  bug.needinfo_epoch = ni.epoch;
  return bug;
}

export class GeneralTriage extends React.PureComponent {
  static contextType = GlobalContext;

  constructor(props) {
    super(props);
    this.state = {
      loaded: false,
      awaitingNetwork: false,
      triageNeededBugs: [],
      recentRegressionBugs: [],
      needinfoEscalatedBugs: [],
      needinfoStaleBugs: [],
      unassignedS1Bugs: [],
      unassignedS2Bugs: [],
    };
  }

  getQueries() {
    return [
      // Triage Needed
      {
        email1: "wptsync@mozilla.bugs",
        emailreporter1: "1",
        emailtype1: "notequals",
        include_fields: includeFields,
        keywords: "intermittent_failure",
        keywords_type: "nowords",
        resolution: "---",
        rules: [
          { key: "bug_type", operator: "equals", value: "defect" },
          {
            key: "flagtypes.name",
            operator: "notsubstring",
            value: "needinfo",
          },
          { key: "bug_severity", operator: "anyexact", value: "--, n/a" },
          { key: "keywords", operator: "notsubstring", value: "meta" },
          generalTriageComponentsRule,
        ],
      },
      // Recent Regressions
      {
        chfield: "[Bug creation]",
        chfieldfrom: this.context.releases.beta.date,
        chfieldto: "Now",
        include_fields: includeFields,
        keywords: "regression",
        keywords_type: "allwords",
        resolution: "---",
        rules: [
          { key: "priority", operator: "nowords", value: "S1,S2" },
          {
            key: "flagtypes.name",
            operator: "notsubstring",
            value: "needinfo",
          },
          {
            operator: "OR",
            rules: [
              {
                key: `cf_status_firefox${this.context.releases.release.version}`,
                operator: "nowords",
                value:
                  "affected,unaffected,fixed,verified,disabled,verified disabled,wontfix,fix-optional",
              },
              {
                key: `cf_status_firefox${this.context.releases.beta.version}`,
                operator: "nowords",
                value:
                  "affected,unaffected,fixed,verified,disabled,verified disabled,wontfix,fix-optional",
              },
            ],
          },
          generalTriageComponentsRule,
        ],
      },
      // NI? Escalations & NI? > 14 days
      {
        include_fields: includeFields,
        resolution: "---",
        rules: [
          { key: "flagtypes.name", operator: "substring", value: "needinfo" },
          generalTriageComponentsRule,
        ],
      },
      // Unassigned S1 Defects & Unassigned S2 Defects
      {
        include_fields: includeFields,
        resolution: "---",
        rules: [
          {
            key: "bug_severity",
            operator: "anyexact",
            value: "s1,blocker,s2,critical",
          },
          {
            key: "assigned_to",
            operator: "equals",
            value: "nobody@mozilla.org",
          },
          {
            key: "flagtypes.name",
            operator: "notsubstring",
            value: "needinfo",
          },
          {
            key: "cf_status_firefox_nightly",
            operator: "nowords",
            value: "fixed,verified,wontfix,disabled,unaffected",
          },
          { key: "keywords", operator: "notsubstring", value: "stalled" },
          generalTriageComponentsRule,
        ],
      },
    ];
  }

  async componentWillMount() {
    this._isMounted = true;
    await this.context.qm.runCachedQueries(
      this.getQueries(),
      () => this._isMounted,
      ({
        rsp: [
          { bugs: triageNeededBugs },
          { bugs: recentRegressionBugs },
          { bugs: needinfoBugs },
          { bugs: unassignedBugs },
        ],
        awaitingNetwork,
      }) => {
        const now = Date.now();
        const needinfoEscalatedBugs = [];
        const needinfoStaleBugs = [];
        for (const bug of needinfoBugs) {
          const needinfos = [];
          for (const flag of bug.flags) {
            if (flag.name === "needinfo") {
              flag.epoch = Date.parse(flag.creation_date);
              flag.age = Math.ceil((now - flag.epoch) / (1000 * 3600 * 24));
              needinfos.push(flag);
            }
          }
          bug.needinfos = needinfos.sort((a, b) => b.age - a.age);
          const relManNI = bug.needinfos.find(
            ni => ni.setter === "release-mgmt-account-bot@mozilla.tld"
          );
          const staleNI = bug.needinfos.find(
            ni => ni.setter !== ni.requestee && ni.age > 14
          );
          if (relManNI) {
            needinfoEscalatedBugs.push(addNeedinfoDetails(bug, relManNI));
          } else if (staleNI) {
            needinfoStaleBugs.push(addNeedinfoDetails(bug, staleNI));
          }
        }
        for (const set of [needinfoEscalatedBugs, needinfoStaleBugs]) {
          set.sort((a, b) => a.needinfo_epoch - b.needinfo_epoch);
        }

        const unassignedS1Bugs = [];
        const unassignedS2Bugs = [];
        for (const bug of unassignedBugs) {
          switch (bug.severity.toLowerCase()) {
            case "s1":
            case "blocker":
              unassignedS1Bugs.push(bug);
              break;
            case "s2":
            case "critical":
              unassignedS2Bugs.push(bug);
              break;
          }
        }

        this.setState({
          loaded: true,
          awaitingNetwork,
          triageNeededBugs,
          recentRegressionBugs,
          needinfoEscalatedBugs,
          needinfoStaleBugs,
          unassignedS1Bugs,
          unassignedS2Bugs,
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
        heading={"General Triage"}
        subHeading={
          <React.Fragment>
            This list includes untriaged bugs in{" "}
            <a
              href="https://bugzilla.mozilla.org/buglist.cgi?product=Firefox&component=General&resolution=---"
              target="_blank"
              rel="noopener noreferrer">
              Firefox::General
            </a>{" "}
            and{" "}
            <a
              href="https://bugzilla.mozilla.org/buglist.cgi?product=Toolkit&component=General&resolution=---"
              target="_blank"
              rel="noopener noreferrer">
              Toolkit::General
            </a>
            .
            <br />
            Firefox Desktop engineers share responsibility for these components
            on a{" "}
            <a
              href="https://docs.google.com/document/d/1_r8lKtJg1FXeY9R3mufsQKI3ylXiIrrLgsb3DqC0EoA/edit?usp=sharing"
              target="_blank"
              rel="noopener noreferrer">
              rotating basis
            </a>
            .
          </React.Fragment>
        }>
        <React.Fragment>
          {this.state.triageNeededBugs.length === 0 &&
            this.state.recentRegressionBugs.length === 0 &&
            this.state.needinfoEscalatedBugs.length === 0 &&
            this.state.needinfoStaleBugs.length === 0 &&
            this.state.unassignedS1Bugs.length === 0 &&
            this.state.unassignedS2Bugs.length === 0 && <h3>No Bugs</h3>}
        </React.Fragment>
        <BugList
          title="Triage Needed"
          titleTooltip={`Bugs that have not been triaged (without a severity). Bugs with the meta keyword are ignored and open needinfo requests are ignored.`}
          compact={true}
          showResolvedOption={false}
          visibleIfEmpty={false}
          bulkEdit={false}
          tags={true}
          bugs={this.state.triageNeededBugs}
          columns={triageNeededColumns}
        />
        <BugList
          title="Important Recent Regressions"
          titleTooltip={`Bugs with a regression keyword created since the start of the current Beta cycle (${this.context.releases.beta.date}) that do not have both status-firefox${this.context.releases.beta.version} and status-firefox${this.context.releases.release.version} set. Bugs with an open needinfo request are ignored.\n`}
          compact={true}
          showResolvedOption={false}
          visibleIfEmpty={false}
          bulkEdit={false}
          tags={false}
          bugs={this.state.recentRegressionBugs}
          columns={generalTriageColumns}
        />
        <BugList
          title="Needinfo Escalations"
          titleTooltip="Needinfo requests generated by the escalation system."
          compact={true}
          showResolvedOption={false}
          visibleIfEmpty={false}
          bulkEdit={false}
          tags={true}
          bugs={this.state.needinfoEscalatedBugs}
          columns={generalTriageColumns}
        />
        <BugList
          title="Needinfo > 14 days"
          titleTooltip="Needinfo requests older than 14 days, excluding self-needinfos and bugs with the stalled keyword."
          compact={true}
          showResolvedOption={false}
          visibleIfEmpty={false}
          bulkEdit={false}
          tags={true}
          bugs={this.state.needinfoStaleBugs}
          columns={generalTriageColumns}
        />
        <BugList
          title="Unassigned S1 Defects"
          titleTooltip="Catastrophic (S1) defects without an assignee and no pending needinfos, excluding bugs with the stalled keyword."
          compact={true}
          showResolvedOption={false}
          visibleIfEmpty={false}
          bulkEdit={false}
          tags={true}
          bugs={this.state.unassignedS1Bugs}
          columns={unassignedColumns}
        />
        <BugList
          title="Unassigned S2 Defects"
          titleTooltip="Serious (S2) defects without an assignee and no pending needinfos, excluding bugs with the stalled keyword."
          compact={true}
          showResolvedOption={false}
          visibleIfEmpty={false}
          bulkEdit={false}
          tags={true}
          bugs={this.state.unassignedS2Bugs}
          columns={unassignedColumns}
        />
        <MiniLoader hidden={!this.state.awaitingNetwork} />
      </Container>
    );
  }
}
