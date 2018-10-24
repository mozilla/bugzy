import {DateTime} from "luxon";

interface ReleaseDefinition {
  startVersion: number;
  iterationsPattern: number[]
}

const EPOC_DATE = DateTime.local(2018, 1, 15);
const REFERENCE_RELEASES: ReleaseDefinition[] = [
  {
    startVersion: 60,
    iterationsPattern: Array(4).fill(2)
  },
  {
    startVersion: 62,
    iterationsPattern: [2, 2, 2, 1]
  },
  {
    startVersion: 63,
    iterationsPattern: Array(5).fill(2)
  },
  {
    startVersion: 64,
    iterationsPattern: [2, 2, 3]
  }
];

interface IterationLookup {
  byDate: {[date: string]: string},
  byVersionString: {[versionString: string]: {startDate: DateTime, endDate: DateTime, weeks: number}},
  orderedVersionStrings: string[]
}

function generateIterationDates(): IterationLookup {
  const EPOC_ITERATION = REFERENCE_RELEASES[0];
  const LAST_ITERATION = REFERENCE_RELEASES[REFERENCE_RELEASES.length - 1];
  const END_VERSION = 80;

  const result: IterationLookup = {byDate: {}, byVersionString: {}, orderedVersionStrings: []};
  let currentReferenceIndex = 0;
  let currentDate = EPOC_DATE;
  let currentVersion = EPOC_ITERATION.startVersion;

  while (currentVersion <= END_VERSION) {
    let currentReference = REFERENCE_RELEASES[currentReferenceIndex];
    let currentIteration = 0;

    // Add all iterations
    while (currentIteration < currentReference.iterationsPattern.length) {
      const weeksInIteration = currentReference.iterationsPattern[currentIteration];
      for (let i = 0; i < weeksInIteration; i++) {
        // Add items to result
        const versionString = `${currentVersion}.${currentIteration + 1}`;
        result.byDate[currentDate.toISODate()] = `${currentVersion}.${currentIteration + 1}`;
        if (!result.byVersionString[versionString]) {
          result.byVersionString[versionString] = {
            startDate: currentDate,
            weeks: weeksInIteration,
            endDate: currentDate.plus({days: weeksInIteration * 7 - 1})
          };
          result.orderedVersionStrings.push(versionString);
        }

        currentDate = currentDate.plus({weeks: 1});
      }
      currentIteration += 1;
    }

    // Increment version
    currentVersion += 1;

    const nextReference = REFERENCE_RELEASES[currentReferenceIndex + 1];
    if (nextReference && currentVersion === nextReference.startVersion) {
      currentReferenceIndex += 1;
    }
  }
  return result;
}

const ITERATION_LOOKUP = generateIterationDates();

function getMondayBefore(date: DateTime): DateTime {
  return date.minus({days: date.weekday - 1});
}

interface LegacyIteration {
  number: string;
  start: string;
  due: string;
}

export function getIterationByDate(datestring: string | DateTime): LegacyIteration {
  if (!datestring) datestring = DateTime.local();
  const date = typeof datestring === "string" ? DateTime.fromISO(datestring) : datestring;
  const monday = getMondayBefore(date);
  const iterationString = ITERATION_LOOKUP.byDate[monday.toISODate()];
  const iteration = ITERATION_LOOKUP.byVersionString[iterationString];
  return {
    number: iterationString,
    start: iteration.startDate.toISO(),
    due: iteration.endDate.toISO()
  };
}

export function getAdjacentIteration(diff: number, date: string | DateTime): LegacyIteration {
  const baseIteration: string = getIterationByDate(date).number;
  const index = ITERATION_LOOKUP.orderedVersionStrings.indexOf(baseIteration);
  const iterationString = ITERATION_LOOKUP.orderedVersionStrings[index + diff];
  const iteration = ITERATION_LOOKUP.byVersionString[iterationString]
  return {
    number: iterationString,
    start: iteration.startDate.toISO(),
    due: iteration.endDate.toISO()
  };
}
