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

function renderWhiteboard({whiteboard, severity}) {
  const regex = /\[(.+?)\]/g;
  let matches = [];
  const tags = [];
  while (matches = regex.exec(whiteboard)) {
    tags.push(matches[1]);
  }
  if (severity === "normal") {
    tags.push("DEFECT");
  }
  return <ul className={styles.tagList}>{tags.map(tag => {
    let style = {};
    let label = tag;
    if (tagConfig[tag]) {
      style = tagConfig[tag].style;
      label = tagConfig[tag].label;
    }
    return (<li style={style} key={tag}>{label}</li>);
  })}</ul>;
}

export const columnTransforms = {
  id(value) {
    return (<a href={OPEN_BUG_URL + value}>{value}</a>);
  },
  summary(value, bug, props) {
    return (<React.Fragment>
      {value}<br />
      {!!props.tags && renderWhiteboard(bug)}
    </React.Fragment>)
  },
  assigned_to(value) {
    return getShortName(value);
  },
  cf_fx_iteration(value) {
    return value.split(" - ")[0];
  },
  target_milestone(value) {
    return value.replace("Firefox ", "");
  },
  last_change_time(value) {
    const now = new DateTime.local();
    const t = new DateTime.fromISO(value).setZone();
    if (t.hasSame(now, "day")) {
      return t.toFormat("t");
    } else {
      return t.toFormat("MMM d t");
    }
  }
};
