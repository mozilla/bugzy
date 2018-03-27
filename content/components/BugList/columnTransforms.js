import React from "react";
import {emails} from "../../../config/people";
import tagConfig from "../../../config/tags";
import styles from "./BugList.scss";
const {DateTime} = require("luxon");

const OPEN_BUG_URL = "https://bugzilla.mozilla.org/show_bug.cgi?id=";

function getShortName(email) {
  if (email === "nobody@mozilla.org") return "";
  return emails[email] || email;
}

function renderWhiteboard({whiteboard, keywords, severity, hasPR}) {
  const regex = /\[(.+?)\]/g;
  let matches = [];
  let tags = [];
  if (keywords) {
    tags = tags.concat(keywords);
  }
  while (matches = regex.exec(whiteboard)) {
    tags.push(matches[1]);
  }
  if (severity === "normal") {
    tags.push("DEFECT");
  }
  if (hasPR) {
    tags.push("HAS-PR");
  }

  return <ul className={styles.tagList}>{tags.map(tag => {
    // Filter out tags that aren't added to the confic
    // if (!tagConfig[tag]) return;

    let style = {};
    let label = tag;

    if (tagConfig[tag]) {
      style = tagConfig[tag].style;
      label = tagConfig[tag].label;
    }

    return (<li style={style} key={tag}>{label}</li>);
  }).filter(t => t)}</ul>;
}

export const columnTransforms = {
  id(value) {
    return (<a href={OPEN_BUG_URL + value}>{value}</a>);
  },
  summary(value, bug, props) {
    return (<React.Fragment>
      <a href={OPEN_BUG_URL + bug.id}>{value}</a>
      {!!props.tags && renderWhiteboard(bug)}
    </React.Fragment>)
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
    } else {
      return t.toFormat("ccc MMM d");
    }
  }
};
