import { DateTime } from "luxon";

/**
 * Manual overrides for the iteration lookup below. This can be used to fix
 * erroneous iteration numbers and date ranges on Bugzilla. It can't be used to
 * add new iterations, since that would require sorting, which is slow.
 * @example { iteration: "66.1", range: "Dec 10 - 23" }
 * @example { iteration: "66.2", range: null } // use null to exclude iterations
 */
const ITERATION_OVERRIDES: { iteration: string; range: string | null }[] = [
  // { iteration: "66.1", range: "Dec 10 - 23" },
  // { iteration: "66.2", range: null }...
];

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

/**
 * For a given list of iteration strings, make an object with lookup tables for
 * iteration strings and dates. Each string must have an iteration number (e.g.
 * 100.1) and a date range. Order is important so the date computations work
 * correctly, and so we're able to parse duplicates as overrides.
 * @param {string[]} iterations List of iteration strings
 * @returns {IterationLookup} Lookup object
 * @example $ lookupIterations(["91.1 - Jan 4 - 15", "91.2 - Jan 18 - 29"])
 *          > {
 *              byDate: { "2019-01-07": "91.1", "2019-01-14": "91.1", ... },
 *              byVersionString: { "91.1": { startDate: "2019-01-04", ... } },
 *              orderedVersionStrings: ["91.1", "91.2"], ...
 *            }
 */
export function lookupIterations(iterations: string[]): IterationLookup {
  const lookup: IterationLookup = {
    byDate: {},
    byVersionString: {},
    orderedVersionStrings: [],
  };

  const iterationsByRange = new Map();
  const rangesByIteration = new Map();
  const STARTING_VERSION = 67;
  // Remove duplicate date ranges (override in insertion order)
  for (const value of iterations) {
    const match = value.match(/(\d+)\.(\d+) - (.*)/);
    if (match) {
      const version = parseInt(match[1], 10);
      // Ignore iterations before 67.1
      if (version < STARTING_VERSION) continue;
      const iterationString = `${match[1]}.${match[2]}`;
      iterationsByRange.set(match[3], iterationString);
    }
  }
  // Remove duplicate versions
  for (const [range, iteration] of iterationsByRange) {
    rangesByIteration.set(iteration, range);
  }
  // Add manual overrides
  for (const { iteration, range } of ITERATION_OVERRIDES) {
    if (range) {
      rangesByIteration.set(iteration, range);
    } else {
      rangesByIteration.delete(iteration);
    }
  }

  // In order to generate actual dates, we need to infer the year, since
  // iterations aren't stored with years. We do this by using the starting
  // version date as the epoch, and incrementing the year by one each time we
  // see an iteration's start date has a month before the previous iteration's
  // start date month.
  let lastDate: DateTime;
  let lastMonth = -1;
  let year = 2019;
  for (const [iteration, range] of rangesByIteration) {
    // We can handle dates of the forms "July 3 - 14" and "Aug 28 - Sept 8"
    // (where the end date falls in a different month than the start date).
    const match = range.match(/(\w+) (\d+) ?- ?(?:(\w+) )?(\d+)/);
    if (match) {
      const startMonth = normalizeMonthString(match[1]);
      const endMonth = match[3] ? normalizeMonthString(match[3]) : startMonth;
      let startDate = DateTime.fromFormat(
        `${startMonth} ${match[2]} ${year}`,
        "LLL d y",
        { locale: "en-US" }
      );
      if (startDate.month < lastMonth) {
        year += 1;
      }
      startDate = startDate.set({ year }).startOf("week");
      lastMonth = startDate.month;
      while (lastDate && startDate < lastDate) {
        // This iteration starts before the previous iteration ended. That means
        // we actually want it to start on the first Monday after the start.
        startDate = startDate.plus({ weeks: 1 });
      }
      const startDateTime = startDate.startOf("day").toISO();
      let endDate = DateTime.fromFormat(
        `${endMonth} ${match[4]} ${year}`,
        "LLL d y",
        { locale: "en-US" }
      );
      if (endDate.month < lastMonth) {
        year += 1;
      }
      // If the end date is a Monday, set it to the previous Sunday.
      if (endDate.weekday === 1) {
        endDate = endDate.minus({ days: 1 });
      }
      // Otherwise, set it to the next Sunday.
      endDate = endDate.set({ year }).endOf("week");
      lastDate = endDate;
      lastMonth = lastDate.month;
      const endDateTime = endDate.startOf("day").toISO();
      const weeks = Math.ceil(endDate.diff(startDate, "days").days / 7);
      if (startDateTime && endDateTime && weeks) {
        lookup.byVersionString[iteration] = {
          startDate: startDateTime,
          weeks,
          endDate: endDateTime,
        };
        lookup.orderedVersionStrings.push(iteration);
        const start = DateTime.fromISO(startDateTime);
        for (let i = 0; i < weeks; i++) {
          const monday = start.plus({ weeks: i });
          lookup.byDate[monday.toFormat("yyyy-MM-dd")] = iteration;
        }
      }
    }
  }

  return lookup;
}

/**
 * Convert a month string to a 3-letter abbreviation. Some month strings from
 * Bugzilla iterations are full month strings or 4-letter abbreviations like
 * "Sept", so we need to convert them to abbreviations that luxon can parse.
 * @param {string} month
 * @returns {string}
 * @example "September" => "Sep"
 * @example "Sept" => "Sep"
 * @example "AUG" => "Aug"
 */
function normalizeMonthString(month: string): string {
  return month
    .slice(0, 3)
    .toLowerCase()
    .replace(/^./, c => c.toUpperCase());
}

/**
 * Get the Monday before a given date.
 * @param {DateTime|Date|string} date
 * @returns {DateTime}
 */
export function getMondayBefore(date: DateTime | Date | string): DateTime {
  if (typeof date === "string") {
    date = DateTime.fromISO(date);
  }
  if (date instanceof Date) {
    date = DateTime.fromJSDate(date);
  }
  const { weekday } = date;
  if (weekday === 1) return date;
  return date.minus({ days: weekday - 1 });
}

/**
 * Return the number of work days (M-F) between two dates.
 * @param {Date|string} startDate
 * @param {Date|string} endDate
 * @returns {number}
 */
export function getWorkDays(
  startDate: Date | string,
  endDate: Date | string
): number {
  const [start, end] = [startDate, endDate].map(raw => {
    if (raw instanceof Date) return DateTime.fromJSDate(raw);
    return DateTime.fromISO(raw);
  });
  const startWeekDay = start.weekday;
  const endWeekDay = end.weekday;
  const DAYS_PER_WEEK = 5;
  const weeksBetween =
    end
      .startOf("week")
      .diff(start.startOf("week"), "weeks")
      .toObject().weeks || 0;
  let days = weeksBetween * DAYS_PER_WEEK;
  const extraDays = Math.min(startWeekDay, 6) - 1;
  const missingDays = Math.min(endWeekDay, 5);
  // Remove/add extra days
  days = days - extraDays + missingDays;
  return days;
}

/**
 * A class that provides utilities for looking up iterations by date or version.
 * While IterationLookup is passed through network requests, Iterations is
 * constructed on the client side.
 */
export class Iterations implements IterationLookup {
  byDate: { [date: string]: string };
  byVersionString: {
    [versionString: string]: {
      startDate: string;
      endDate: string;
      weeks: number;
    };
  };
  orderedVersionStrings: string[];

  constructor(iterationLookup: IterationLookup) {
    Object.assign(this, iterationLookup);
  }

  /**
   * For a given date (or no date for today), return the iteration number, the
   * start date, and the due date.
   * @param {string|DateTime} [dateString] defaults to today
   * @returns {LegacyIteration|null}
   */
  getIteration(dateString?: string | DateTime): LegacyIteration {
    if (!dateString) dateString = DateTime.local();
    const date =
      typeof dateString === "string"
        ? DateTime.fromISO(dateString)
        : dateString;
    const monday = getMondayBefore(date);
    const iterationString = this.byDate[monday.toISODate()];
    const iteration = this.byVersionString[iterationString];
    return iteration
      ? {
          number: iterationString,
          start: iteration.startDate,
          due: iteration.endDate,
        }
      : null;
  }

  /**
   * Get the latest iteration.
   * @returns {LegacyIteration}
   */
  getLatestIteration(): LegacyIteration {
    const iterationString = this.orderedVersionStrings[
      this.orderedVersionStrings.length - 1
    ];
    const iteration = this.byVersionString[iterationString];
    return {
      number: iterationString,
      start: iteration && iteration.startDate,
      due: iteration && iteration.endDate,
    };
  }

  /**
   * Find an upcoming or previous iteration, computed relative to the given date
   * (or today if no date is given).
   * @param {number} diff n for upcoming iterations, -n for previous iterations
   * @param {string|DateTime} [dateString] defaults to today
   * @returns {LegacyIteration}
   */
  getAdjacentIteration(
    diff: number,
    dateString?: string | DateTime
  ): LegacyIteration {
    const baseIteration: string = this.getIteration(dateString)?.number;
    const index = this.orderedVersionStrings.indexOf(baseIteration);
    const iterationString = this.orderedVersionStrings[index + diff];
    const iteration = this.byVersionString[iterationString];
    return baseIteration
      ? {
          number: iterationString,
          start: iteration && iteration.startDate,
          due: iteration && iteration.endDate,
        }
      : null;
  }

  /**
   * Get the start and due dates for a given iteration string.
   * @param {string} iteration e.g. "110.1"
   * @returns {IterationDates}
   */
  getDatesForIteration(iteration: string): IterationDates {
    const iterationData = this.byVersionString[iteration];
    return {
      start: DateTime.fromISO(iterationData.startDate),
      due: DateTime.fromISO(iterationData.endDate),
    };
  }
}
