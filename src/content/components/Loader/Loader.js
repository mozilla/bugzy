import * as loaderStyles from "./Loader.module.scss";
import * as miniLoaderStyles from "./MiniLoader.module.scss";
import React, { useState } from "react";

export const Loader = () => (
  <div className={loaderStyles.loaderContainer}>
    <div className={loaderStyles.loader}>Loading...</div>
  </div>
);

export const MiniLoader = props => {
  const [stopped, setStopped] = useState(null);
  return (
    <div
      className={miniLoaderStyles.miniLoader}
      hidden={props.hidden}
      stopped={stopped}
      onTransitionEnd={() => setStopped("")}
      title="Checking for new bugs...">
      <span>Refreshing...</span>
    </div>
  );
};
