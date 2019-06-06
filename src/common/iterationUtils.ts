import { DateTime } from "luxon";
import { ITERATION_LOOKUP } from "./ITERATION_LOOKUP";

/**
 * getWorkDays - returns number of work days (M-F) between two dates.
 *
 * @param {any} startDate
 * @param {any} endDate
 * @returns {int} number of work days
 */
export function getWorkDays(startDate: Date | string, endDate: Date | string) {
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
  days = days - extraDays;
  days = days + missingDays;

  return days;
}

function getMondayBefore(date: DateTime): DateTime {
  return date.minus({ days: date.weekday - 1 });
}

interface LegacyIteration {
  number: string;
  start: string;
  due: string;
}

export function getIterationByDate(
  datestring: string | DateTime
): LegacyIteration {
  if (!datestring) datestring = DateTime.local();
  const date =
    typeof datestring === "string" ? DateTime.fromISO(datestring) : datestring;
  const monday = getMondayBefore(date);
  const iterationString = ITERATION_LOOKUP.byDate[monday.toISODate()];
  const iteration = ITERATION_LOOKUP.byVersionString[iterationString];
  return {
    number: iterationString,
    start: iteration.startDate,
    due: iteration.endDate,
  };
}

export const getIteration = getIterationByDate;

export function getAdjacentIteration(
  diff: number,
  date: string | DateTime
): LegacyIteration {
  const baseIteration: string = getIterationByDate(date).number;
  const index = ITERATION_LOOKUP.orderedVersionStrings.indexOf(baseIteration);
  const iterationString = ITERATION_LOOKUP.orderedVersionStrings[index + diff];
  const iteration = ITERATION_LOOKUP.byVersionString[iterationString];
  return {
    number: iterationString,
    start: iteration.startDate,
    due: iteration.endDate,
  };
}
