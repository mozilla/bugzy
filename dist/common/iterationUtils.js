"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const luxon_1 = require("luxon");
const ITERATION_LOOKUP_1 = require("./ITERATION_LOOKUP");
/**
 * getWorkDays - returns number of work days (M-F) between two dates.
 *
 * @param {any} startDate
 * @param {any} endDate
 * @returns {int} number of work days
 */
function getWorkDays(startDate, endDate) {
    const [start, end] = [startDate, endDate].map(raw => {
        if (raw instanceof Date)
            return luxon_1.DateTime.fromJSDate(raw);
        return luxon_1.DateTime.fromISO(raw);
    });
    const startWeekDay = start.weekday;
    const endWeekDay = end.weekday;
    const DAYS_PER_WEEK = 5;
    const weeksBetween = end
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
exports.getWorkDays = getWorkDays;
function getMondayBefore(date) {
    return date.minus({ days: date.weekday - 1 });
}
exports.getMondayBefore = getMondayBefore;
function getIterationByDate(datestring) {
    if (!datestring)
        datestring = luxon_1.DateTime.local();
    const date = typeof datestring === "string" ? luxon_1.DateTime.fromISO(datestring) : datestring;
    const monday = getMondayBefore(date);
    const iterationString = ITERATION_LOOKUP_1.ITERATION_LOOKUP.byDate[monday.toISODate()];
    const iteration = ITERATION_LOOKUP_1.ITERATION_LOOKUP.byVersionString[iterationString];
    return {
        number: iterationString,
        start: iteration.startDate,
        due: iteration.endDate,
    };
}
exports.getIterationByDate = getIterationByDate;
exports.getIteration = getIterationByDate;
function getAdjacentIteration(diff, date) {
    const baseIteration = getIterationByDate(date).number;
    const index = ITERATION_LOOKUP_1.ITERATION_LOOKUP.orderedVersionStrings.indexOf(baseIteration);
    const iterationString = ITERATION_LOOKUP_1.ITERATION_LOOKUP.orderedVersionStrings[index + diff];
    const iteration = ITERATION_LOOKUP_1.ITERATION_LOOKUP.byVersionString[iterationString];
    return {
        number: iterationString,
        start: iteration.startDate,
        due: iteration.endDate,
    };
}
exports.getAdjacentIteration = getAdjacentIteration;
