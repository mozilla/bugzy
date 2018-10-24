
import {DateTime} from "luxon";

import * as iterationRange from "./iterationRange";

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
    else return DateTime.fromISO(raw);
  });

  const startWeekDay = start.weekday;
  const endWeekDay = end.weekday;

  const DAYS_PER_WEEK = 5;
  const weeksBetween = end.startOf("week").diff(start.startOf("week"), "weeks").toObject().weeks || 0;
  let days = weeksBetween * DAYS_PER_WEEK;

  const extraDays = Math.min(startWeekDay, 6) - 1;
  const missingDays = Math.min(endWeekDay, 5);

  // Remove/add extra days
  days = days - extraDays;
  days = days + missingDays;

  return days;
}

export function getIteration(date: DateTime | string) {
  return iterationRange.getIterationByDate(date);
}

export function getAdjacentIteration(diff: number, date: DateTime | string) {
  return iterationRange.getAdjacentIteration(diff, date);
}
