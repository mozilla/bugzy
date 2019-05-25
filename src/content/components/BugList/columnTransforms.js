import React from "react";
import {emails, ui_emails} from "../../../config/people";
import tagConfig from "../../../config/tags";
import styles from "./BugList.scss";
import priorityStyles from "../PriorityGuide/PriorityGuide.scss";
import {DateTime} from "luxon";
const OPEN_BUG_URL = "https://bugzilla.mozilla.org/show_bug.cgi?id=";

const numberWithSpaces = n => {
  const letters = n.toString().split("");
  return (
    <React.Fragment>
      <span>{letters.slice(0, -3).join("")}</span>
      <span>{letters.slice(-3).join("")}</span>
    </React.Fragment>
  );
  // return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "·");
};

function formatDate(value) {
  const now = DateTime.local();
  const t = DateTime.fromISO(value).setZone();
  if (t.hasSame(now, "day")) {
    return t.toFormat("t");
  }
  return t.toFormat("ccc MMM d");
}

function getShortName(email) {
  if (email === "nobody@mozilla.org") {
    return "";
  }
  return emails[email] || email;
}

export function parseIteration(iterationString) {
  const result = iterationString.match(/\d+\.\d+/);
  return result ? result[0] : "";
}

function renderWhiteboard({whiteboard, keywords, type, hasPR, flags}) {
  const regex = /\[(.+?)\]/g;
  let matches = [];
  let tags = [];
  if (keywords) {
    tags = tags.concat(keywords);
  }
  if (type) {
    tags.push(type);
  }
  while ((matches = regex.exec(whiteboard))) {
    // eslint-disable-line no-cond-assign
    tags.push(matches[1]);
  }
  if (hasPR) {
    tags.push("has-pr");
  }
  if (flags && flags.find(flag => flag.name === "needinfo")) {
    tags.push("needinfo");
  }
  // Label uiwanted if a designer is need info
  if (flags && flags.length && flags.some(flag => ui_emails.includes(flag.requestee))) {
    tags.push("uiwanted");
  }

  return (
    <ul className={styles.tagList}>
      {tags
        .map(tag => {
          // Filter out tags that aren't added to the config
          // if (!tagConfig[tag]) return;

          let style = {};
          let label = tag;

          if (tagConfig[tag]) {
            style = tagConfig[tag].style;
            label = tagConfig[tag].label;
          }

          return (
            <li style={style} key={tag}>
              {label}
            </li>
          );
        })
        .filter(t => t)}
    </ul>
  );
}

export const columnTransforms = {
  id(value) {
    return (
      <a target="_blank" href={OPEN_BUG_URL + value} rel="noopener noreferrer">
        {numberWithSpaces(value)}
      </a>
    );
  },
  summary(value, bug, props) {
    const tags = !!props.tags && renderWhiteboard(bug);
    const flags = renderWhiteboard({flags: bug.flags});
    return (
      <React.Fragment>
        <a target="_blank" rel="noopener noreferrer" href={OPEN_BUG_URL + bug.id}>
          {value}
        </a>
        {tags || flags}
      </React.Fragment>
    );
  },
  assigned_to(value) {
    return getShortName(value);
  },
  cf_fx_iteration(value) {
    return parseIteration(value) || "--";
  },
  _custom_release(_, bug) {
    return parseIteration(bug.cf_fx_iteration).split(".")[0];
  },
  cf_last_resolved(value) {
    if (!value) {
      return "";
    }
    return formatDate(value);
  },
  last_change_time(value) {
    return formatDate(value);
  },
  priority(priority) {
    return <span className={priorityStyles[priority.toLowerCase()]}>{priority}</span>;
  },
  status(_, bug) {
    let text = bug.status.toLowerCase();
    const isGitHubMerged =
      bug.keywords && bug.keywords.includes("github-merged") && bug.status !== "RESOLVED";
    const isNew = ["NEW", "ASSIGNED", "REOPENED"].includes(bug.status);
    if (isGitHubMerged) {
      text = "github-merged";
    } else if (isNew) {
      text = "";
    }
    const labelStyle = styles[`status-${text}`];
    return text ? (
      <span className={styles.statusLabel + (labelStyle ? ` ${labelStyle}` : "")}>{text}</span>
    ) : (
      ""
    );
  },
};
