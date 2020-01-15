import * as React from "react";
import { getTargetingAttributes } from "./TargetingParser";
import styles from "./ActiveRSMessages.scss";
import { columnTransforms } from "../BugList/columnTransforms";
import { fetchBugById, RSMessage } from "../../../server/queryUtils";

interface CFRMessage extends RSMessage {
  content: {
    action: {
      data: {
        url: string;
      };
    };
    buttons: {
      primary: {
        action: {
          type: string;
        };
      };
    };
  };
}

interface BucketsConfig {
  [bucketName: string]: {
    url: string;
    additionalColumns: string[];
  };
}

const BUCKETS: BucketsConfig = {
  "What's New": {
    url:
      "https://firefox.settings.services.mozilla.com/v1/buckets/main/collections/whats-new-panel/records",
    additionalColumns: [],
  },
  CFR: {
    url:
      "https://firefox.settings.services.mozilla.com/v1/buckets/main/collections/cfr/records",
    additionalColumns: ["frequency", "action", "url"],
  },
};

const BUGZILLA = {
  "1597708": [
    "WHATS_NEW_BADGE_72",
    "WHATS_NEW_FINGERPRINTER_COUNTER_72",
    "WHATS_NEW_FINGERPRINTER_COUNTER_ALT",
    "WHATS_NEW_PERMISSION_PROMPT_72",
    "WHATS_NEW_PIP_72",
  ],
  "1599476": [
    "WHATS_NEW_BADGE_MOBILE_71",
    "WHATS_NEW_MOBILE_71",
    "WHATS_NEW_MOBILE_FEAT_1_71",
    "WHATS_NEW_MOBILE_FEAT_2_71",
    "WHATS_NEW_MOBILE_FEAT_2_71_NONFXA",
    "WHATS_NEW_MOBILE_FEAT_1_71_NONFXA",
    "WHATS_NEW_MOBILE_71_NONFXA",
  ],
  "1569349": [
    "SEND_TAB_CFR",
    "SEND_RECIPE_TAB_CFR",
    "PDF_URL_FFX_SEND",
    "BOOKMARK_SYNC_CFR",
  ],
};

const REDASH = {
  "https://sql.telemetry.mozilla.org/dashboard/messaging-system-what-s-new-panel": [
    "WHATS_NEW_BADGE_MOBILE_71",
    "WHATS_NEW_MOBILE_71",
    "WHATS_NEW_MOBILE_FEAT_1_71",
    "WHATS_NEW_MOBILE_FEAT_2_71",
    "WHATS_NEW_MOBILE_FEAT_2_71_NONFXA",
    "WHATS_NEW_MOBILE_FEAT_1_71_NONFXA",
    "WHATS_NEW_MOBILE_71_NONFXA",
    "WHATS_NEW_BADGE_72",
    "WHATS_NEW_FINGERPRINTER_COUNTER_72",
    "WHATS_NEW_FINGERPRINTER_COUNTER_ALT",
    "WHATS_NEW_PERMISSION_PROMPT_72",
    "WHATS_NEW_PIP_72",
  ],
  "https://sql.telemetry.mozilla.org/dashboard/activity-stream-cfr_1": [
    "YOUTUBE_ENHANCE_3_72",
    "GOOGLE_TRANSLATE_3_72",
    "FACEBOOK_CONTAINER_3_72",
    "PIN_TAB",
  ],
  "https://sql.telemetry.mozilla.org/dashboard/relationship-cfrs": [
    "SEND_TAB_CFR",
    "SEND_RECIPE_TAB_CFR",
    "PDF_URL_FFX_SEND",
    "SEND_TAB_CFR",
    "SAVE_LOGIN",
  ]
};

export class ActiveRSMessages extends React.PureComponent {
  state: {
    messages: Array<RSMessage>;
    buckets: BucketsConfig;
    selectedBucket: {
      url: string;
      additionalColumns: Array<string>;
    };
  };

  constructor(props) {
    super(props);
    this.state = {
      messages: [],
      buckets: BUCKETS,
      selectedBucket: BUCKETS.CFR,
    };
    this.bucketUpdate = this.bucketUpdate.bind(this);
    this.parseTargetingExpression = this.parseTargetingExpression.bind(this);
    this.fetchBugzillaMetadata = this.fetchBugzillaMetadata.bind(this);
    this._renderRSMessage = this._renderRSMessage.bind(this);
  }

  async fetchBugzillaMetadata(message: RSMessage) {
    const bugzillaId = Object.keys(BUGZILLA).find(id =>
      BUGZILLA[id].includes(message.id)
    );
    const unknownStatus = { ...message, status: "unknown", bugzillaId };
    if (!bugzillaId) {
      return unknownStatus;
    }
    const metadata = await fetchBugById(bugzillaId);
    if (metadata) {
      return {
        ...message,
        status: columnTransforms.status(bugzillaId, metadata),
        bugzillaId,
      };
    }

    return unknownStatus;
  }

  updateRSMessages(bkey: string) {
    fetch(`/remote-settings/?uri=${BUCKETS[bkey].url}`)
      .then(response => response.json())
      .then(messages => messages.map(this.parseTargetingExpression))
      .then(messages => messages.map(this.fetchBugzillaMetadata))
      .then(messages => {
        return Promise.all(messages);
      })
      .then(messages =>
        this.setState({ messages, selectedBucket: BUCKETS[bkey] })
      );
  }

  bucketUpdate(el: React.ChangeEvent<HTMLSelectElement>) {
    this.updateRSMessages(el.target.value);
  }

  groupSimilarTargeting(a: RSMessage, b: RSMessage) {
    let versionA = a.parsedTargetingExpression.version.join(" ").match(/\d/g);
    let versionB = b.parsedTargetingExpression.version.join(" ").match(/\d/g);

    if (!versionA) {
      return -1;
    }

    if (!versionB) {
      return 1;
    }

    versionA = versionA.join("");
    versionB = versionB.join("");

    return versionB - versionA;
  }

  parseTargetingExpression(m: RSMessage): RSMessage {
    const parsedTargetingExpression = getTargetingAttributes(m.targeting);
    return { ...m, parsedTargetingExpression };
  }

  componentDidMount() {
    this.updateRSMessages("CFR");
  }

  _renderAdditionalColumnHeaders(): JSX.Element[] {
    return this.state.selectedBucket.additionalColumns.map((columnName, i) => (
      <td key={i}>{columnName}</td>
    ));
  }

  _renderAdditionalColumns(message: RSMessage | CFRMessage): JSX.Element[] {
    return this.state.selectedBucket.additionalColumns.map((columnName, i) => {
      switch (columnName) {
        case "frequency":
          return (
            <td key={i}>
              {message.frequency ? message.frequency.lifetime : "Unlimited"}
            </td>
          );
        case "action":
          return (
            <td key={i}>
              {" "}
              {message.content.buttons
                ? message.content.buttons.primary.action.type
                : "None"}{" "}
            </td>
          );
        case "url": {
          switch (message.template) {
            case "update_action":
              return <td key={i}> {message.content.action.data.url} </td>;
            default:
              return <td key={i}> n/a </td>;
          }
        }
        default:
          return null;
      }
    });
  }

  _renderRSMessage(message: RSMessage): React.ReactNode {
    const parsedTargeting = message.parsedTargetingExpression;
    const redashLink = Object.keys(REDASH).find(key =>
      REDASH[key].includes(message.id)
    );
    return (
      <tr key={message.id}>
        <td>{message.id}</td>
        <td>{parsedTargeting.version.join(" ") || "All"}</td>
        <td>{parsedTargeting.locale.join(" ") || "All"}</td>
        <td>
          {message.bugzillaId
            ? columnTransforms.id(message.bugzillaId)
            : "None"}
        </td>
        <td>{message.status}</td>
        {this._renderAdditionalColumns(message)}
        <td>{redashLink ? <a href={redashLink}>Dashboard</a> : "n/a"}</td>
      </tr>
    );
  }

  render(): React.ReactNode {
    return (
      <div className={styles.RSTable}>
        <h1>Active Remote Settings Messages</h1>
        <h3>
          Select RS Bucket:
          <select onChange={this.bucketUpdate} defaultValue="CFR">
            {Object.keys(this.state.buckets).map(bkey => (
              <option value={bkey} key={bkey}>
                {bkey}
              </option>
            ))}
          </select>
        </h3>
        <table>
          <thead>
            <tr>
              <td>Message ID</td>
              <td>Version targeting</td>
              <td>Locale targeting</td>
              <td>Bugzilla</td>
              <td>Status</td>
              {this._renderAdditionalColumnHeaders()}
              <td>Redash</td>
            </tr>
          </thead>
          <tbody>{this.state.messages.map(this._renderRSMessage)}</tbody>
        </table>
      </div>
    );
  }
}
