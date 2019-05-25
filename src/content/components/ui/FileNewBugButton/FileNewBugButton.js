import React from "react";
import gStyles from "../../../styles/gStyles.scss";
import {BUGZILLA_PRODUCT, FILE_NEW_BUGZILLA_COMPONENT} from "../../../../config/project_settings";

export const FileNewBugButton = props => {
  const url = `https://bugzilla.mozilla.org/enter_bug.cgi?${
    props.params
  }&product=${BUGZILLA_PRODUCT}&component=${FILE_NEW_BUGZILLA_COMPONENT}`;
  let className = props.unstyled ? "" : gStyles.primaryButton;
  if (props.className) {
    className += ` ${props.className}`;
  }
  return (
    <a target="_blank" rel="noopener noreferrer" className={className} href={url}>
      File new bug
    </a>
  );
};
