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

export interface FutureRelease {
  version: number;
  nightly_start: string;
  beta_start: string;
}

export interface PastRelease {
  nightly_start: string;
  merge_day: string;
}

/**
 * For a given list of iteration strings, make an object with lookup tables for
 * iteration strings and dates. Each string must have an iteration number (e.g.
 * 100.1) and a date range. Order is important so the date computations work
 * correctly, and so we're able to parse duplicates as overrides.
 * @param {string[]} iterations List of iteration strings
 * @param {Array<{ version: number; start: string; end: string }>} releases List of release objects
 * @returns {IterationLookup} Lookup object
 */
export function lookupIterations(
  iterations: string[],
  releases: Array<{ version: number; start: string; end: string }> = []
): IterationLookup {
  const lookup: IterationLookup = {
    byVersionString: {},
    orderedVersionStrings: [],
  };

  const rangesByIteration = new Map();
  const STARTING_VERSION = 111;
  const TWO_WEEK_CADENCE_TRANSITION = 155;
  for (const value of iterations) {
    const match = value.match(/(\d+)\.(\d+) - (.*)/);
    if (match) {
      const version = parseInt(match[1], 10);
      // Ignore iterations before 111 or after 155
      if (version < STARTING_VERSION || version > TWO_WEEK_CADENCE_TRANSITION) {
        continue;
      }
      const iterationString = `${match[1]}.${match[2]}`;
      // match[1].match[2] is the iteration number like 155.1, and match[3] is
      // the date range like "Aug 28 - Sept 8"
      rangesByIteration.set(iterationString, match[3]);
    }
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
  let lastDate: DateTime | null = null;
  let lastMonth = -1;
  let year = 2022;
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
      }
    }
  }

  // now we need to add the releases to the lookup. they have a different shape
  // that's more straightforward:
  // {
  //   version: 156,
  //   start: "2026-08-13 00:00:00+00:00",
  //   end: "2026-08-27 16:00:00+00:00",
  // }
  // but these start and end on thursdays, whereas iterations are supposed to
  // start on mondays and end on sundays. so we need to adjust the dates to jam
  // them into the iteration lookup. we also need to run the above process in
  // reverse to get a date range string like "Aug 13 - 23", since releases don't
  // have that information. we can do this by using the start and end dates to
  // get the month and day, and then formatting them into a string. those get
  // added to orderedVersionStrings and byVersionString. trying to fit these
  // nice dates onto the janky iteration lookup table is pretty silly, but it
  // would be more effort to update everything else.

  for (const release of releases) {
    const { version, start, end } = release;
    const startDate = DateTime.fromSQL(start, { setZone: true });
    const endDate = DateTime.fromSQL(end, { setZone: true });
    const startDateTime = startDate.startOf("day").toISO();
    const endDateTime = endDate.startOf("day").toISO();
    if (startDateTime && endDateTime) {
      const iterationString = version.toString();
      const weeks = Math.ceil(endDate.diff(startDate, "days").days / 7);
      lookup.byVersionString[iterationString] = {
        startDate: startDateTime,
        weeks,
        endDate: endDateTime,
      };
      lookup.orderedVersionStrings.push(iterationString);
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
    end.startOf("week").diff(start.startOf("week"), "weeks").toObject().weeks ||
    0;
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
  byVersionString: {
    [versionString: string]: {
      startDate: string;
      endDate: string;
      weeks: number;
    };
  } = {};
  orderedVersionStrings: string[] = [];

  constructor(iterationLookup: IterationLookup) {
    Object.assign(this, iterationLookup);
  }

  /**
   * For a given date (or no date for today), return the iteration/release whose
   * date range contains that date. If a date falls on the transition between two
   * overlapping ranges (like the edge between releases), the later iteration is
   * returned. If no range contains the date, the closest iteration is returned.
   * @param {string|DateTime} [dateString] defaults to today
   * @returns {LegacyIteration}
   */
  getIteration(dateString?: string | DateTime): LegacyIteration {
    if (!dateString) dateString = DateTime.utc();
    const date =
      typeof dateString === "string"
        ? DateTime.fromISO(dateString)
        : dateString;

    // Search through iterations in reverse (latest first) so that overlapping
    // date ranges prefer the later iteration
    for (let i = this.orderedVersionStrings.length - 1; i >= 0; i--) {
      const iterationString = this.orderedVersionStrings[i];
      const iteration = this.byVersionString[iterationString];

      const startDate = DateTime.fromISO(iteration.startDate);
      const endDate = DateTime.fromISO(iteration.endDate);

      if (date >= startDate && date <= endDate) {
        return {
          number: iterationString,
          start: iteration.startDate,
          due: iteration.endDate,
        };
      }
    }

    // Date doesn't fall within any range, find the closest iteration
    let closestIteration = this.orderedVersionStrings[0];
    let closestDistance = Infinity;

    for (const iterationString of this.orderedVersionStrings) {
      const iteration = this.byVersionString[iterationString];
      const startDate = DateTime.fromISO(iteration.startDate);
      const endDate = DateTime.fromISO(iteration.endDate);

      let distance: number;
      if (date < startDate) {
        distance = startDate.diff(date, "days").days;
      } else {
        distance = date.diff(endDate, "days").days;
      }

      if (distance < closestDistance) {
        closestDistance = distance;
        closestIteration = iterationString;
      }
    }

    const iteration = this.byVersionString[closestIteration];
    return {
      number: closestIteration,
      start: iteration.startDate,
      due: iteration.endDate,
    };
  }

  /**
   * Find an upcoming or previous iteration, computed relative to the given date
   * (or today if no date is given).
   * @param {number} diff n for upcoming iterations, -n for previous iterations
   * @param {string} [baseIterationString] the iteration number to start from.
   *                                       defaults to the current iteration.
   * @returns {LegacyIteration|null} null if there is no adjacent iteration
   */
  getAdjacentIteration(
    diff: number,
    baseIterationString?: string
  ): LegacyIteration | null {
    if (!baseIterationString) {
      baseIterationString = this.getIteration().number;
    }
    const index = this.orderedVersionStrings.indexOf(baseIterationString);
    if (index === -1) {
      throw new Error("Invalid base iteration string");
    }
    const iterationString = this.orderedVersionStrings[index + diff];
    if (!iterationString) {
      return null;
    }
    const iteration = this.byVersionString[iterationString];
    return {
      number: iterationString,
      start: iteration && iteration.startDate,
      due: iteration && iteration.endDate,
    };
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
