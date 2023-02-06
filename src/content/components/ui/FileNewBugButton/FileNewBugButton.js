import React from "react";
import gStyles from "../../../styles/gStyles.scss";
import { prefs } from "../../../lib/prefs";
import { BUGZILLA_PRODUCT } from "../../../../config/project_settings";

export const FileNewBugButton = props => {
  const url = `${prefs.get("root_url")}/enter_bug.cgi?${
    props.params
  }&product=${BUGZILLA_PRODUCT}`;
  let className = props.unstyled ? "" : gStyles.primaryButton;
  if (props.className) {
    className += ` ${props.className}`;
  }
  return (
    <a
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      href={url}>
      File new bug
    </a>
  );
};
