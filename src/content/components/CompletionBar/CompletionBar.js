import React from "react";
import styles from "./CompletionBar.scss";
import {getWorkDays} from "../../../common/iterationUtils";
import {isBugResolvedOrMerged} from "../../lib/utils";

const Marker = props => (
  <div
    className={`${styles.marker} ${styles[props.position || "top"]}`}
    style={{left: `${props.percentage}%`}}>
    {props.children}
  </div>
);

// Renders a percentage bar
// <CompletionBar bugs={[...]} startDate="2018-04-10" endDate="2018-04-12" />
export const CompletionBar = props => {
  const currentDate = props.currentDate || new Date();
  const totalWorkDays = getWorkDays(props.startDate, props.endDate);
  const completedWorkDays = getWorkDays(props.startDate, currentDate);
  const daysPercentage = (completedWorkDays / totalWorkDays) * 100;

  const totalBugs = props.bugs.length;
  const completedBugs = props.bugs.filter(bug => isBugResolvedOrMerged(bug)).length;
  const bugsPercentage = (completedBugs / totalBugs) * 100;

  const aheadOfSchedule = daysPercentage < bugsPercentage;

  return (
    <div className={styles.container}>
      <div className={styles.innerWrapper}>
        <div className={styles.completionBar}>
          <div
            className={`${styles.dateBar} ${aheadOfSchedule ? styles.ahead : styles.behind}`}
            style={{width: `${daysPercentage}%`}}
          />
          <div className={styles.bugsBar} style={{width: `${bugsPercentage}%`}} />
        </div>
        <div className={styles.dateLine} style={{left: `${daysPercentage}%`}} />
        <Marker position="bottom" percentage={daysPercentage}>
          Today
        </Marker>
        <Marker percentage={bugsPercentage}>
          {completedBugs}/{totalBugs} done
        </Marker>
      </div>
    </div>
  );
};
