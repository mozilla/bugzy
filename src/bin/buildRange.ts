import * as fs from "fs";
import * as path from "path";

import { DateTime } from "luxon";

interface ReleaseDefinition {
  startVersion: number;
  iterationsPattern: number[];
}

const EPOC_DATE = DateTime.local(2018, 1, 15);
const REFERENCE_RELEASES: ReleaseDefinition[] = [
  {
    startVersion: 60,
    iterationsPattern: Array(4).fill(2),
  },
  {
    startVersion: 62,
    iterationsPattern: [2, 2, 2, 1],
  },
  {
    startVersion: 63,
    iterationsPattern: Array(5).fill(2),
  },
  {
    startVersion: 64,
    iterationsPattern: [2, 2, 3],
  },
  {
    startVersion: 65,
    iterationsPattern: [2, 2, 2, 1],
  },
  {
    startVersion: 68,
    iterationsPattern: [2, 2, 2, 3],
  },
  {
    startVersion: 69,
    iterationsPattern: [1, 2, 2, 2],
  },
  {
    startVersion: 70,
    iterationsPattern: [2, 2, 2, 2],
  },
  {
    startVersion: 71,
    iterationsPattern: [2, 2, 2, 1],
  },
  {
    startVersion: 72,
    iterationsPattern: [2, 2, 2],
  },
  {
    startVersion: 73,
    iterationsPattern: [2, 2, 1],
  },
  {
    startVersion: 75,
    iterationsPattern: [2, 2],
  },
  {
    startVersion: 86,
    iterationsPattern: [2, 2, 2],
  },
  {
    startVersion: 87,
    iterationsPattern: [2, 2],
  },
  {
    startVersion: 90,
    iterationsPattern: [2, 2, 2],
  },
  {
    startVersion: 92,
    iterationsPattern: [2, 2],
  },
];

export interface IterationLookup {
  byDate: { [date: string]: string };
  byVersionString: {
    [versionString: string]: {
      startDate: string;
      endDate: string;
      weeks: number;
    };
  };
  orderedVersionStrings: string[];
}

export function generateIterationDates(): IterationLookup {
  const EPOC_ITERATION = REFERENCE_RELEASES[0];
  const END_VERSION = 120;

  const result: IterationLookup = {
    byDate: {},
    byVersionString: {},
    orderedVersionStrings: [],
  };
  let currentReferenceIndex = 0;
  let currentDate = EPOC_DATE;
  let currentVersion = EPOC_ITERATION.startVersion;

  while (currentVersion <= END_VERSION) {
    let currentReference = REFERENCE_RELEASES[currentReferenceIndex];
    let currentIteration = 0;

    // Add all iterations
    while (currentIteration < currentReference.iterationsPattern.length) {
      const weeksInIteration =
        currentReference.iterationsPattern[currentIteration];
      for (let i = 0; i < weeksInIteration; i++) {
        // Add items to result
        const versionString = `${currentVersion}.${currentIteration + 1}`;
        result.byDate[
          currentDate.toISODate()
        ] = `${currentVersion}.${currentIteration + 1}`;
        if (!result.byVersionString[versionString]) {
          result.byVersionString[versionString] = {
            startDate: currentDate.toISO(),
            weeks: weeksInIteration,
            endDate: currentDate
              .plus({ days: weeksInIteration * 7 - 1 })
              .toISO(),
          };
          result.orderedVersionStrings.push(versionString);
        }

        currentDate = currentDate.plus({ weeks: 1 });
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

const fileContent = `
// GENERATED FILE
import {IterationLookup} from "../bin/buildRange";
export const ITERATION_LOOKUP: IterationLookup = ${JSON.stringify(
  generateIterationDates()
)};
`;

fs.writeFileSync(
  path.join(__dirname, "../common/ITERATION_LOOKUP.ts"),
  fileContent
);
