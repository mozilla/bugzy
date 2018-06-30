import React from "react";
import {emails} from "../../../config/people";
import tagConfig from "../../../config/tags";
import styles from "./BugList.scss";
import {DateTime} from "luxon";

const OPEN_BUG_URL = "https://bugzilla.mozilla.org/show_bug.cgi?id=";

const numberWithSpaces = n => {
  const letters = n.toString().split("");
  return (<React.Fragment><span>{letters.slice(0, -3).join("")}</span><span>{letters.slice(-3).join("")}</span></React.Fragment>);
  // return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "·");
};

function getShortName(email) {
  if (email === "nobody@mozilla.org") { return ""; }
  return emails[email] || email;
}

function renderWhiteboard({whiteboard, keywords, severity, hasPR, flags}) {
  const regex = /\[(.+?)\]/g;
  let matches = [];
  let tags = [];
  if (keywords) {
    tags = tags.concat(keywords);
  }
  while (matches = regex.exec(whiteboard)) { // eslint-disable-line no-cond-assign
    tags.push(matches[1]);
  }
  if (severity === "normal") {
    tags.push("DEFECT");
  }
  if (hasPR) {
    tags.push("has-pr");
  }
  if (flags && flags.find(flag => flag.name === "needinfo")) {
    tags.push("needinfo");
  }

  return (<ul className={styles.tagList}>{tags.map(tag => {
    // Filter out tags that aren't added to the config
    // if (!tagConfig[tag]) return;

    let style = {};
    let label = tag;

    if (tagConfig[tag]) {
      style = tagConfig[tag].style;
      label = tagConfig[tag].label;
    }

    return (<li style={style} key={tag}>{label}</li>);
  }).filter(t => t)}</ul>);
}

export const columnTransforms = {
  id(value) {
    return (<a target="_blank" href={OPEN_BUG_URL + value} rel="noopener noreferrer">{numberWithSpaces(value)}</a>);
  },
  summary(value, bug, props) {
    const tags = !!props.tags && renderWhiteboard(bug);
    const flags = renderWhiteboard({flags: bug.flags});
    return (<React.Fragment>
      <a target="_blank" rel="noopener noreferrer" href={OPEN_BUG_URL + bug.id}>{value}</a>
      {tags || flags}
    </React.Fragment>);
  },
  assigned_to(value) {
    return getShortName(value);
  },
  cf_fx_iteration(value) {
    return value.split(" - ")[0];
  },
  _custom_release(_, bug) {
    return bug.cf_fx_iteration.split(" - ")[0].split(".")[0];
  },
  last_change_time(value) {
    const now = new DateTime.local();
    const t = new DateTime.fromISO(value).setZone();
    if (t.hasSame(now, "day")) {
      return t.toFormat("t");
    }
    return t.toFormat("ccc MMM d");
  }
};
