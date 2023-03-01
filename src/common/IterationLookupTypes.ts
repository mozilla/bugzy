import { DateTime } from "luxon";

export interface IterationLookup {
  // iterations by date in YYYY-MM-DD format
  byDate: { [date: string]: string };
  // date info by iteration string e.g. "100.1"
  byVersionString: {
    [versionString: string]: {
      startDate: string; // In DateTime ISO format with timezone
      endDate: string;
      weeks: number; // Number of Mondays spent in the iteration
    };
  };
  // List of versions, ordered by iteration number
  orderedVersionStrings: string[];
}

export interface LegacyIteration {
  number: string;
  start: string;
  due: string;
}

export interface IterationDates {
  start: DateTime;
  due: DateTime;
}
