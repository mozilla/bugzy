import React from "react";
import styles from "./PocketNewtabView.scss";
import gStyles from "../../styles/gStyles.scss";
import {BugList} from "../BugList/BugList";
import {Loader} from "../Loader/Loader";
import {CopyButton} from "../CopyButton/CopyButton";
import {isBugResolved, runQuery} from "../../lib/utils";
import {getIteration} from "../../../common/iterationUtils";
import {BUGZILLA_PRODUCT, FILE_NEW_BUGZILLA_COMPONENT} from "../../../config/project_settings";

// Use 66.4 iteration date - Jan 25, 2019 to pick 66 release for Pocket New Tab view
const pocketIteration = getIteration("2019-01-25");
const Fx66Release = parseInt(pocketIteration.number.split(".")[0], 10);
const Fx67Release = Fx66Release + 1;
const upliftTrackingField = `cf_tracking_firefox${Fx66Release}`;

const QA_EMAILS = ["bnagabandi@getpocket.com"];

const displayColumns = [
  "id",
  "summary",
  "assigned_to",
  "cf_fx_iteration",
  // "priority",
  "status",
];
const allColumns = displayColumns.concat([
  "priority",
  "target_milestone",
  "status",
  "resolution",
  "last_change_time",
  "whiteboard",
  "keywords",
  "type",
  "flags",
  "alias",
  "blocks",
  upliftTrackingField,
  `cf_status_firefox${Fx66Release}`,
  `cf_status_firefox${Fx67Release}`,
]);

// Legal values for cf_status_firefox
//   "?",
//   "unaffected",
//   "affected",
//   "fix-optional",
//   "fixed",
//   "wontfix",
//   "verified",
//   "disabled",
//   "verified disabled"
// ];

function isExported(bug, fxRelease) {
  return ["fixed", "verified"].includes(bug[`cf_status_firefox${fxRelease}`]);
}

function isBugVerified(bug) {
  return ["VERIFIED"].includes(bug.status);
}

function isReadyForExport(bug) {
  return bug.keywords.includes("github-merged");
}

function isMetaResolved(bug) {
  return (
    ["RESOLVED", "CLOSED"].includes(bug.status) &&
    !isExported(bug, Fx67Release) &&
    !isExported(bug, Fx66Release)
  );
}

function isBugUpliftCandidate(bug) {
  return (
    ["?", "+", "blocking"].includes(bug.cf_tracking_beta) &&
    ["?", "+"].includes(bug[upliftTrackingField]) &&
    !["fixed", "verified"].includes(bug.cf_status_beta)
  );
}

function doesBugNeedQA(bug) {
  return (
    bug.flags && bug.flags.length && bug.flags.some(flag => QA_EMAILS.includes(flag.requestee))
  );
}

const customColumnTransforms = {
  status(_, bug) {
    const isVerified = bug.status === "VERIFIED";
    let text;
    if (isVerified) {
      if (["fixed", "verified"].includes(bug.cf_status_beta)) {
        text = "Beta";
      } else if (["fixed", "verified"].includes(bug.cf_status_nightly)) {
        text = "Nightly";
      } else {
        text = "verified";
      }
    } else if (isExported(bug, Fx66Release)) {
      text = "uplifted";
    } else if (isExported(bug, Fx67Release)) {
      text = "exported";
    } else if (isMetaResolved(bug)) {
      text = "done";
    } else if (isBugUpliftCandidate(bug)) {
      text = "needuplift";
    }
    const labelStyle = styles[`status-${text}`];
    return text ? (
      <span className={styles.statusLabel + (labelStyle ? ` ${labelStyle}` : "")}>{text}</span>
    ) : (
      ""
    );
  },
};

const CompactBugList = props => (
  <BugList
    compact={true}
    columnTransforms={customColumnTransforms}
    showResolvedOption={false}
    crossOutResolved={false}
    bulkEdit={true}
    tags={true}
    bugs={props.bugs}
    subtitle={props.subtitle}
    columns={displayColumns}
    showHeaderIfEmpty={true}
    {...props}
  />
);

export class PocketNewtabView extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {bugs: [], loaded: false};
  }

  innerSort(a, b) {
    const a1 = a.assigned_to;
    const a2 = b.assigned_to;
    const isAUnassigned = a.cf_fx_iteration === "---";
    const isBUnassigned = b.cf_fx_iteration === "---";
    const aResolved = isBugResolved(a);
    const bResolved = isBugResolved(b);
    const aUplift = isBugUpliftCandidate(a);
    const bUplift = isBugUpliftCandidate(b);

    if (aResolved < bResolved) {
      return -1;
    }
    if (aResolved > bResolved) {
      return 1;
    }

    if (aUplift > bUplift) {
      return -1;
    }
    if (aUplift < bUplift) {
      return 1;
    }

    // Sort unassigned iteration bugs to the bottom
    if (isAUnassigned && !isBUnassigned) {
      return 1;
    }
    if (!isAUnassigned && isBUnassigned) {
      return -1;
    }

    if (a.cf_fx_iteration < b.cf_fx_iteration) {
      return -1;
    }
    if (a.cf_fx_iteration > b.cf_fx_iteration) {
      return 1;
    }

    if (a1 < a2) {
      return -1;
    }
    if (a1 > a2) {
      return 1;
    }

    if (a.priority < b.priority) {
      return -1;
    }
    if (a.priority > b.priority) {
      return 1;
    }

    return 0;
  }

  handleBugs(result, bug, fxRelease) {
    // Bug Lifecycle
    // Starts with Ready for Engineering
    // Ready for Export (github-merged status)
    // Exported ( Merged in nightly with cf_status_firefox${fxRelease} as fixed)
    // Ready for Uplift (Merged in 67 and has tracking flag set for 66)
    // Ready for testing - Merged in nightly and if tracked for 66 uplifted to 66
    // Verified - QA verified with bug status as VERIFIED
    if (isExported(bug, fxRelease)) {
      if (doesBugNeedQA(bug)) {
        result.nightlyReadyForTesting.push(bug);
      }
      if (isBugUpliftCandidate(bug)) {
        result.uplift.push(bug);
      } else if (isBugVerified(bug)) {
        result.nightlyVerified.push(bug);
      } else {
        result.nightlyExported.push(bug);
      }
    } else if (isReadyForExport(bug)) {
      result.nightlyReadyForExport.push(bug);
    } else if (fxRelease === Fx66Release) {
      result.nightlyReadyForEng.push(bug);
    } else {
      result.postMerge.push(bug);
    }
  }

  sortByRelease(bugs) {
    const result = {
      untriaged: [],
      uplift: [],
      nightlyReadyForEng: [],
      nightlyReadyForExport: [],
      nightlyReadyForTesting: [],
      nightlyExported: [],
      nightlyVerified: [],
      postMerge: [],
      backlog: [],
    };

    const subMetas = {};
    bugs.forEach(bug => {
      if (bug.summary.toLowerCase().startsWith("[meta]")) {
        subMetas[bug.id] = bug;
      }
    });

    for (const bug of bugs) {
      if (bug.summary.toLowerCase().startsWith("[meta]")) {
        continue;
      } else if (["P1", "P2"].includes(bug.priority)) {
        bug.blocks.forEach(blocked => {
          if (blocked in subMetas) {
            const metaBug = subMetas[blocked];
            bug.summary = `[${metaBug.alias || metaBug.id}] ${bug.summary}`;
          }
        });
        if (bug.cf_fx_iteration.match(Fx66Release)) {
          this.handleBugs(result, bug, Fx66Release);
        } else {
          // handle beta bugs merged in 67 release
          this.handleBugs(result, bug, Fx67Release);
        }
      } else if (bug.priority === "--") {
        result.untriaged.push(bug);
      } else {
        result.backlog.push(bug);
      }
    }
    Object.keys(result).forEach(key => result[key].sort(this.innerSort));
    return result;
  }

  async getBugs(id) {
    if (!id) {
      return;
    }
    this.setState({bugs: [], loaded: false});
    const result = await runQuery({
      include_fields: allColumns,
      resolution: ["---", "FIXED"],
      custom: {blocked: id},
    });
    this.setState({bugs: result.bugs, loaded: true});
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.metaId !== this.props.metaId) {
      this.getBugs(nextProps.metaId);
    }
  }

  componentWillMount() {
    this.getBugs(this.props.metaId);
  }

  renderFileNewBug(bugNumber) {
    const url = `https://bugzilla.mozilla.org/enter_bug.cgi?blocked=${bugNumber}&product=${BUGZILLA_PRODUCT}&component=${FILE_NEW_BUGZILLA_COMPONENT}`;
    return (
      <a
        target="_blank"
        rel="noopener noreferrer"
        className={`${gStyles.primaryButton} ${gStyles.headerButton}`}
        href={url}>
        File new bug
      </a>
    );
  }

  renderBugs(bugs) {
    const bugsByRelease = this.sortByRelease(this.state.bugs);
    return (
      <React.Fragment>
        <h3>Untriaged</h3>
        <CompactBugList bugs={bugsByRelease.untriaged} />

        <h3>Beta/release cycle MVP</h3>
        <p>
          This is the set of bugs we will complete before Firefox 67 merges to beta / 66 merges to
          release.
        </p>
        <CompactBugList
          subtitle="Ready for engineering"
          bugs={bugsByRelease.postMerge}
          crossOutResolved={true}
        />
        <CompactBugList subtitle="Ready for export" bugs={bugsByRelease.nightlyReadyForExport} />
        <CompactBugList
          subtitle="Ready for testing - Tracking uplift"
          bugs={bugsByRelease.uplift}
        />
        <CompactBugList
          subtitle="Flagged for testing"
          bugs={bugsByRelease.nightlyReadyForTesting}
        />
        <CompactBugList subtitle="Exported bugs" bugs={bugsByRelease.nightlyExported} />
        <CompactBugList subtitle="Verified bugs" bugs={bugsByRelease.nightlyVerified} />

        <h3>Backlog</h3>
        <CompactBugList bugs={bugsByRelease.backlog} />

        <h3>Complete - Nightly cycle MVP</h3>
        <CompactBugList
          subtitle="Ready for engineering"
          bugs={bugsByRelease.nightlyReadyForEng}
          crossOutResolved={true}
        />
      </React.Fragment>
    );
  }

  render() {
    const metasById = {};
    for (const item of this.props.metas) {
      metasById[item.id] = item;
    }

    const {metaId} = this.props;
    return (
      <div className={styles.container}>
        <h1>
          <a href={`https://bugzilla.mozilla.org/show_bug.cgi?id=${metaId}`}>
            {metasById[metaId].displayName}
          </a>{" "}
          {this.renderFileNewBug(metaId)}
        </h1>
        <p className={styles.subheading}>
          This list includes bugs in any component blocking meta bug{" "}
          <a href={`https://bugzilla.mozilla.org/show_bug.cgi?id=${metaId}`}> {metaId}</a>{" "}
          <CopyButton text={metaId} title="Copy bug number" />{" "}
        </p>
        {this.state.loaded ? this.renderBugs() : <Loader />}
      </div>
    );
  }
}
