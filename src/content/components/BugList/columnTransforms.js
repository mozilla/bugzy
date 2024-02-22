import React from "react";
import { emails } from "../../../config/people";
import tagConfig from "../../../config/tags";
import * as styles from "./BugList.module.scss";
import * as priorityStyles from "../PriorityGuide/PriorityGuide.module.scss";
import { DateTime } from "luxon";
import { prefs } from "../../lib/prefs";
import icons from "../../img/icons/*.svg";

const OPEN_BUG_URL = "https://bugzilla.mozilla.org/show_bug.cgi?id=";
const TICKET_URL = "https://mozilla-hub.atlassian.net/browse/";

const numberWithSpaces = n => {
  const letters = n.toString().split("");
  return (
    <React.Fragment>
      <span>{letters.slice(0, -3).join("")}</span>
      <span className={styles.idSpacer}>&nbsp;</span>
      <span>{letters.slice(-3).join("")}</span>
    </React.Fragment>
  );
};

function formatDate(value, monthAndYear = false) {
  const now = DateTime.local();
  const t = DateTime.fromISO(value).setZone();
  if (monthAndYear) {
    return t.toFormat("MMM yyyy");
  }
  if (t.hasSame(now, "day")) {
    return t.toFormat("t");
  }
  if (!t.hasSame(now, "year")) {
    return t.toFormat("MMM d yyyy");
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

export function getNeedinfoNick(flags) {
  const now = Date.now();
  const needinfos = [];
  for (const flag of flags) {
    if (flag.name === "needinfo") {
      flag.epoch = Date.parse(flag.creation_date);
      flag.age = Math.ceil((now - flag.epoch) / (1000 * 3600 * 24));
      if (flag.setter !== flag.requestee) {
        needinfos.push(flag);
      }
    }
  }
  // sort oldest needinfos first
  needinfos.sort((a, b) => a.epoch - b.epoch);
  const [ni] = needinfos;
  if (ni) {
    return emails[ni.requestee] || ni.requestee.split("@")[0];
  }
  return null;
}

function parseTags({ whiteboard, keywords, hasPR, flags, needinfo_nick }) {
  const regex = /\[(.+?)\]/g;
  let matches = [];
  let tags = [];
  if (keywords) {
    tags = tags.concat(keywords);
  }
  while ((matches = regex.exec(whiteboard))) {
    // eslint-disable-line no-cond-assign
    tags.push(matches[1]);
  }
  if (hasPR) {
    tags.push("has-pr");
  }
  if (needinfo_nick) {
    tags.push(`ni?${needinfo_nick}`);
  } else if (flags && flags.find(flag => flag.name === "needinfo")) {
    let parsedNick = getNeedinfoNick(flags);
    if (parsedNick) {
      tags.push(`ni?${parsedNick}`);
    } else {
      tags.push("needinfo");
    }
  }
  return tags;
}

function renderWhiteboard(bug) {
  return (
    <ul className={styles.tagList}>
      {parseTags(bug)
        .map(tag => {
          // Filter out tags that aren't added to the config
          // if (!tagConfig[tag]) return;

          let style = {};
          let label = tag;

          if (tagConfig[tag]) {
            style = tagConfig[tag].style;
            label = tagConfig[tag].label;
          }

          if (tag.startsWith("ni?")) {
            style = tagConfig["ni?"].style;
            label = tagConfig["ni?"].label.replace("%s", tag.slice(3));
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

function openPriorityGuide() {
  prefs.set("priority_guide_open", true);
}

export const columnTransforms = {
  id(value, bug, props) {
    if (!value) {
      return "";
    }
    let postfix;
    // If the whiteboard has the [omc] tag, it means this bug is directly synced
    // with the Jira ticket. Comments in the bug will be mirrored in the Jira
    // ticket. So if your ticket has multiple child bugs, you don't want to sync
    // them directly with the ticket. You just want to add them to See Also.
    // That means if a bug lacks the [omc] tag, it's probably one of multiple
    // child bugs belonging to that ticket. This allows us to add an emoji to
    // the ticket label, indicating that the ticket has multiple child bugs.
    if (bug.ticket && !parseTags(bug).includes("omc")) {
      // add an icon indicating that this ticket has multiple child bugs
      postfix = (
        <span
          title={`This bug is not synced with its ticket, so it may be one of multiple child bugs.\nIf this is the ticket's only bug, add [omc] to the bug's whiteboard.`}
          role="img"
          style={{ cursor: "help" }}>
          🧩
        </span>
      );
    }
    let className;
    let title;
    if (props.getBugWarning instanceof Function) {
      let { type, message } = props.getBugWarning(bug);
      if (type) {
        className = [styles.warning, styles[type]].filter(Boolean).join(" ");
      }
      title = message;
    }
    return (
      <>
        <a
          target="_blank"
          href={OPEN_BUG_URL + value}
          rel="noopener noreferrer"
          className={className}
          title={title}>
          {numberWithSpaces(value)}
        </a>
        {postfix}
      </>
    );
  },
  summary(value, bug, props) {
    const tags = !!props.tags && renderWhiteboard(bug);
    const flags = renderWhiteboard({ flags: bug.flags });
    return (
      <React.Fragment>
        <a
          target="_blank"
          rel="noopener noreferrer"
          href={OPEN_BUG_URL + bug.id}>
          {value}
        </a>
        {tags || flags}
      </React.Fragment>
    );
  },
  assigned_to(value) {
    return getShortName(value);
  },
  type(value) {
    return <img src={icons[value]} alt={value} title={value} />;
  },
  ticket(value) {
    return value ? (
      <a target="_blank" rel="noopener noreferrer" href={TICKET_URL + value}>
        {value}
      </a>
    ) : (
      ""
    );
  },
  cf_fx_points(value) {
    const hasPoints = value && value !== "---";
    if (!hasPoints) {
      return "";
    }

    let tShirtSize;
    let points = parseInt(value, 10);
    if (points < 3) {
      tShirtSize = "SM";
    } else if (points < 8) {
      tShirtSize = "MD";
    } else if (points < 15) {
      tShirtSize = "LG";
    } else {
      tShirtSize = "XL";
    }

    return (
      <button
        className={priorityStyles[tShirtSize.toLowerCase()]}
        onClick={openPriorityGuide}
        tabIndex="-1"
        title={`${points} points`}>
        {tShirtSize}
      </button>
    );
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
    return formatDate(value, true);
  },
  priority(priority) {
    return (
      <button
        className={priorityStyles[priority.toLowerCase()]}
        onClick={priority == "--" ? null : openPriorityGuide}
        tabIndex="-1">
        {priority}
      </button>
    );
  },
  severity(severity) {
    const label = severity.toUpperCase();
    return (
      <button
        className={priorityStyles[severity.toLowerCase()]}
        onClick={["--", "N/A"].includes(label) ? null : openPriorityGuide}
        tabIndex="-1">
        {label}
      </button>
    );
  },
  status(_, bug) {
    let text = bug.status.toLowerCase();
    const isGitHubMerged =
      bug.keywords &&
      bug.keywords.includes("github-merged") &&
      bug.status !== "RESOLVED";
    const isNew = ["NEW", "ASSIGNED", "REOPENED"].includes(bug.status);
    if (isGitHubMerged) {
      text = "github-merged";
    } else if (isNew) {
      text = "";
    }
    const labelStyle = styles[`status-${text}`];
    return text ? (
      <span
        className={styles.statusLabel + (labelStyle ? ` ${labelStyle}` : "")}>
        {text}
      </span>
    ) : (
      ""
    );
  },
};
