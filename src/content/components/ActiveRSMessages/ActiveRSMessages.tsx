import * as React from "react"
import { getTargetingAttributes } from "./TargetingParser";
import styles from "./ActiveRSMessages.scss";
import gStyles from "../../styles/gStyles.scss"
import { columnTransforms } from "../BugList/columnTransforms";
import { fetchRemoteSettingsMessages, fetchBugById } from "../../../server/queryUtils";

type Message = {
  bugzillaId: string;
  status: string | JSX.Element;
};

type RSMessage = Message & {
  id: string,
  template: string,
  targeting: string,
  parsedTargetingExpression: any,
  frequency: { lifetime: number; };
  content: any;
};

type CFRMessage = RSMessage & {
  content: {
    action: {
      data: {
        url: string;
      }
    },
    buttons: {
      primary: {
        action: {
          type: string;
        }
      }
    }
  }
};

const BUCKETS = {
  "What's New": {
    url: "https://firefox.settings.services.mozilla.com/v1/buckets/main/collections/whats-new-panel/records",
    additionalColumns: [],
  },
  "CFR": {
    url: "https://firefox.settings.services.mozilla.com/v1/buckets/main/collections/cfr/records",
    additionalColumns: ["frequency", "action", "url"],
  }
};

const BUGZILLA = {
  "1597708": ["WHATS_NEW_BADGE_72", "WHATS_NEW_FINGERPRINTER_COUNTER_72", "WHATS_NEW_FINGERPRINTER_COUNTER_ALT", "WHATS_NEW_PERMISSION_PROMPT_72", "WHATS_NEW_PIP_72"],
  "1599476": ["WHATS_NEW_BADGE_MOBILE_71", "WHATS_NEW_MOBILE_71", "WHATS_NEW_MOBILE_FEAT_1_71", "WHATS_NEW_MOBILE_FEAT_2_71", "WHATS_NEW_MOBILE_FEAT_2_71_NONFXA", "WHATS_NEW_MOBILE_FEAT_1_71_NONFXA", "WHATS_NEW_MOBILE_71_NONFXA"],
  "1569349": ["SEND_TAB_CFR", "SEND_RECIPE_TAB_CFR", "PDF_URL_FFX_SEND", "BOOKMARK_SYNC_CFR"],
};

export class ActiveRSMessages extends React.PureComponent {
    state: {
      messages: Array<RSMessage>;
      buckets: Object;
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
        selectedBucket: BUCKETS["CFR"],
      };
      this.bucketUpdate = this.bucketUpdate.bind(this);
      this.parseTargetingExpression = this.parseTargetingExpression.bind(this);
      this.fetchBugzillaMetadata = this.fetchBugzillaMetadata.bind(this);
      this._renderRSMessage = this._renderRSMessage.bind(this);
    }

    async fetchBugzillaMetadata(message: RSMessage) {
      const bugzillaId = Object.keys(BUGZILLA).find(id => BUGZILLA[id].includes(message.id));
      const unknownStatus = { ...message, status: "unknown", bugzillaId };
      if (!bugzillaId) {
        return unknownStatus;
      }
      const metadata = await fetchBugById(bugzillaId);
      if (metadata) {
        return { ...message, status: columnTransforms.status(bugzillaId, metadata), bugzillaId };
      }

      return unknownStatus;
    }

    updateRSMessages(bkey: string) {
      fetchRemoteSettingsMessages(BUCKETS[bkey].url)
            .then(messages => messages.map(this.parseTargetingExpression))
            .then(messages => messages.map(this.fetchBugzillaMetadata))
            .then(messages => { return Promise.all(messages); })
            .then(messages => this.setState({ messages, selectedBucket: BUCKETS[bkey] }));
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
      return this.state.selectedBucket.additionalColumns.map(columnName => <td>{ columnName }</td>);
    }

    _renderAdditionalColumns(message: RSMessage | CFRMessage): JSX.Element[] {
      return this.state.selectedBucket.additionalColumns.map(columnName => {
        switch (columnName) {
          case "frequency": return <td>{ message.frequency ? message.frequency.lifetime : "Unlimited" }</td>;
          case "action": return <td> { message.content.buttons ? message.content.buttons.primary.action.type : "None" } </td>;
          case "url": {
            switch (message.template) {
              case "update_action":
                return <td> { message.content.action.data.url } </td>;
              default:
                return <td> n/a </td>;
            }
          }
          default: return null;
        }
      });
    }

    _renderRSMessage(message: RSMessage): React.ReactNode {
        const parsedTargeting = message.parsedTargetingExpression;
        return <tr key={message.id}>
            <td>{ message.id }</td>
            <td>{ parsedTargeting.version.join(" ") || "All" }</td>
            <td>{ parsedTargeting.locale.join(" ") || "All" }</td>
            <td>{ message.bugzillaId ? columnTransforms.id(message.bugzillaId) : "None" }</td>
            <td>{ message.status }</td>
            { this._renderAdditionalColumns(message) }
        </tr>;
    }

    render(): React.ReactNode {
        return (
            <div className={styles.RSTable}>
                <h1>Active Remote Settings Messages</h1>
                <h3>
                  Select RS Bucket:
                  <select onChange={this.bucketUpdate}>
                    { Object.keys(this.state.buckets).map(
                      bkey =>
                        <option value={bkey}
                          selected={this.state.selectedBucket.url === this.state.buckets[bkey].url}>{ bkey }</option>
                      ) }
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
                        { this._renderAdditionalColumnHeaders() }
                      </tr>
                    </thead>
                  <tbody>
                    { this.state.messages.map(this._renderRSMessage)}
                  </tbody>
                </table>
            </div>
        );
    }
}