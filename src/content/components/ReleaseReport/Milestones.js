import { DateTime } from "luxon";
import { getIteration, getMondayBefore } from "../../../common/iterationUtils";
import { ITERATION_LOOKUP } from "../../../common/ITERATION_LOOKUP";

const iteration = getIteration();
const release = iteration.number.split(".")[0];

function getNextRelease(release) {
  let nextRelease = parseInt(release) + 1;

  return nextRelease;
}

function getPrevRelease() {
  let prevRelease = parseInt(release) - 1;

  return prevRelease;
}

function getStartDate(milestone) {
  let iterationDate = ITERATION_LOOKUP.byVersionString[milestone];
  let milestoneDate = DateTime.fromISO(iterationDate.startDate);

  return milestoneDate;
}

function getEndDate(milestone) {
  let iterationDate = ITERATION_LOOKUP.byVersionString[milestone];
  let milestoneDate = DateTime.fromISO(iterationDate.endDate);

  return milestoneDate;
}

export const RELEASE_MILESTONES = [
  {
    label: "Bug Breakdown",
    calculate() {
      let prevRelease = getPrevRelease(release);
      return getEndDate(`${prevRelease}.4`).plus({ days: -2 });
    },
  },
  {
    label: "PI Request Due",
    calculate() {
      return getEndDate(`${release}.1`).plus({ days: -2 });
    },
  },
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
    label: "Tech Documentation Due",
    calculate() {
      return getEndDate(`${release}.2`).plus({ days: -2 });
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
    label: "Feature Complete",
    calculate() {
      return getEndDate(`${release}.4`).plus({ weeks: -1, days: -2 });
    },
  },
  {
    label: "Nightly Code Freeze",
    calculate() {
      let endDate = getEndDate(`${release}.4`);
      return getMondayBefore(endDate);
    },
  },
  {
    label: "Merge Day",
    calculate() {
      const nextRelease = getNextRelease(release);
      return getStartDate(`${nextRelease}.1`);
    },
  },
  {
    label: "Release Day",
    calculate() {
      const nextRelease = getNextRelease(release);
      return getStartDate(`${nextRelease}.1`).plus({ days: 1 });
    },
  },
];
