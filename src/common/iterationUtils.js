// @flow

const {DateTime} = require("luxon");

// TODO: calculate holidays etc
const ONTARIO_HOLIDAYS = [
  new DateTime.local(1, 1), // New Years
  new DateTime.local(2, 19), // Family day, 3rd month in Feb
  new DateTime.local(3, 30), // Good Friday
  new DateTime.local(4, 2), // Easter Monday
  new DateTime.local(5, 21), // Victoria Day
  new DateTime.local(7, 2), // Canada Day
  new DateTime.local(8, 6), // Civic Holiday
  new DateTime.local(9, 3), // Labour Day
  new DateTime.local(10, 8), // Thanksgiving
  new DateTime.local(11, 12), // Rememberance Day
  new DateTime.local(12, 25), // Christmas
  new DateTime.local(12, 26), // Boxing Day
];

const REFERENCE_ITERATION = {
  start: new DateTime.local(2018, 1, 15),
  major: 60,
  minor: 1
};

const POST_63_REFERENCE_ITERATION = {
  start: new DateTime.local(2018, 6, 25),
  major: 63,
  minor: 1
};

// Track exceptions to the development cycle
const EXCEPTIONS = {
  "63": {MAJOR_IN_WEEKS: 10, MINORS_PER_MAJOR: 5}
}

function getIterationEstimatesWeeks(major) {
  const MAJOR_IN_WEEKS = 8;
  const MINOR_IN_WEEKS = 2;
  const MINORS_PER_MAJOR = 4;

  if (EXCEPTIONS[major]) {
    return {
      MAJOR_IN_WEEKS: EXCEPTIONS[major].MAJOR_IN_WEEKS || MAJOR_IN_WEEKS,
      MINOR_IN_WEEKS: EXCEPTIONS[major].MINOR_IN_WEEKS || MINOR_IN_WEEKS,
      MINORS_PER_MAJOR: EXCEPTIONS[major].MINORS_PER_MAJOR || MINORS_PER_MAJOR
    };
  }

  return {MAJOR_IN_WEEKS, MINOR_IN_WEEKS};
}

function getDatesForIteration(iteration: string) {
  const [major, minor] = iteration.split(".").map(i => parseInt(i));
  const {MAJOR_IN_WEEKS, MINOR_IN_WEEKS} = getIterationEstimatesWeeks(major);

  const reference = major >= 63 ? POST_63_REFERENCE_ITERATION : REFERENCE_ITERATION;

  const weeksToAdd = (+major - reference.major) * MAJOR_IN_WEEKS + (minor - 1) * MINOR_IN_WEEKS;
  const start = reference.start.plus({weeks: weeksToAdd});
  return {
    start,
    due: start.plus({days: 13})
  }
}

/**
 * getWorkDays - returns number of work days (M-F) between two dates.
 *
 * @param {any} startDate
 * @param {any} endDate
 * @returns {int} number of work days
 */
function getWorkDays(startDate: Date | string, endDate: Date | string) {

 const [start, end] = [startDate, endDate].map(raw => {
    if (raw instanceof Date) return new DateTime.fromJSDate(raw);
    else return new DateTime.fromISO(raw);
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

function getIteration(date : Date | string) {
  const actualDate = date ? new DateTime.fromISO(date): DateTime.local();

  const reference = actualDate >= POST_63_REFERENCE_ITERATION.start ? POST_63_REFERENCE_ITERATION : REFERENCE_ITERATION;

  // set to monday of this week
  const monday = actualDate.minus({days: actualDate.weekday - 1});

  const timeSinceReference = monday.diff(reference.start, ["weeks"]).toObject();
  const {MAJOR_IN_WEEKS, MINOR_IN_WEEKS} = getIterationEstimatesWeeks(reference.major);
  const result = {
    major: reference.major + (Math.floor(timeSinceReference.weeks / MAJOR_IN_WEEKS) || 0),
    minor: (Math.floor((timeSinceReference.weeks % MAJOR_IN_WEEKS) / MINOR_IN_WEEKS) || 0) + 1
  };
  const number = `${result.major}.${result.minor}`;
  const {start, due} = getDatesForIteration(number);
  return {
    number,
    start: start.toString(),
    due: due.toString(),
  };
}

function getAdjacentIteration(diff : number, date : Date | string) {
  const current = getIteration(date);
  let [major, minor] = current.number.split(".");
  const {MINORS_PER_MAJOR} = getIterationEstimatesWeeks(major);
  major = +major;
  minor = +minor;

  const convertedNumber = ((major + (minor - 1) / MINORS_PER_MAJOR) + diff / MINORS_PER_MAJOR).toFixed(1);

  const newMajor = Math.floor(convertedNumber);
  const newMinor = Math.round((convertedNumber - newMajor) * MINORS_PER_MAJOR + 1);
  const number = `${newMajor}.${newMinor}`;
  const {start, due} = getDatesForIteration(number);
  return {
    number,
    start: start.toString(),
    due: due.toString(),
  };
}

module.exports = {
  getWorkDays,
  getIteration,
  getAdjacentIteration
};


