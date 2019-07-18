import { DateTime } from "luxon";
import { getIteration } from "../../../common/iterationUtils";
import { ITERATION_LOOKUP } from "../../../common/ITERATION_LOOKUP";

const iteration = getIteration();
const release = iteration.number.split(".")[0];

function getStartDate(milestone) {
  let iterationDate = ITERATION_LOOKUP.byVersionString[milestone];
  let milestoneDate = DateTime.fromISO(iterationDate.startDate);

  return milestoneDate;
}

export const RELEASE_MILESTONES = [
  {
    label: `${release}.1`,
    calculate() {
      return getStartDate(this.label);
    },
  },
  {
    label: `${release}.2`,
    calculate() {
      return getStartDate(this.label);
    },
  },
  {
    label: `${release}.3`,
    calculate() {
      return getStartDate(this.label);
    },
  },
  {
    label: `${release}.4`,
    calculate() {
      return getStartDate(this.label);
    },
  },
  {
    label: "Merge Day",
    calculate() {
      const nextRelease = parseInt(release) + 1;
      return getStartDate(`${nextRelease}.1`);
    },
  },
  {
    label: "Release Day",
    calculate() {
      const nextRelease = parseInt(release) + 1;
      return getStartDate(`${nextRelease}.1`).plus({ days: 1 });
    },
  },
];
