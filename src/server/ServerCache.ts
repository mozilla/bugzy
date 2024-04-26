import {
  DateTime,
  Duration,
  DurationLikeObject,
  HourNumbers,
  MinuteNumbers,
} from "luxon";

type Weekday =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

interface ExpirationInterval {
  weekday: Weekday;
  hour?: HourNumbers; // In UTC, from 0-23, where 0 is midnight.
  minute?: MinuteNumbers;
}

const weekdays: Map<Weekday, number> = new Map([
  ["monday", 1],
  ["tuesday", 2],
  ["wednesday", 3],
  ["thursday", 4],
  ["friday", 5],
  ["saturday", 6],
  ["sunday", 7],
]);

/** A memory "cache" for small server data, used to avoid querying Bugzilla. */
export class ServerCache {
  name: string;
  _data: any;
  duration?: Duration | null;
  interval?: ExpirationInterval | null;
  expirationDate: DateTime | null;

  set data(data: any) {
    this._data = data;
    this._setExpirationDate();
  }

  get data() {
    return this._data;
  }

  /**
   * We want to allow four types of cache invalidation:
   * 1. A maximum age for the cache, after which the data is considered stale.
   *    This is suitable for data that changes sporadically, like bug data.
   * 2. A scheduled interval for expiring the cache, which does not care about
   *    the age of the data. In this case, if you say the cache should expire
   *    every Monday at 12:30 UTC, then it will expire at that time regardless
   *    of when the cache was created. This ensures a stable expire interval
   *    regardless of when the server was started, so it's suitable for caching
   *    data that itself only changes on a schedule (like triage ownership).
   * 3. A combination of both, where the cache will expire when either condition
   *    is met, whichever comes sooner. This is a good way to ensure that data
   *    is refreshed at a specific time, but also to ensure that it's never too
   *    stale. For example, you might want to refresh just before a weekly
   *    meeting, but with that alone you'd only update once per week. By adding
   *    a maximum age, you can additionally update daily, for example.
   * 4. No expiration, which is suitable for data that never changes. Data will
   *    only be invalidated when the server is restarted. (Pass no options.)
   * @param {Object} options
   * @param {DurationLikeObject} [options.maxAge] Maximum age of the cache.
   *   @see {Duration.fromObject}
   *   @see {@link https://moment.github.io/luxon/api-docs/index.html#datetimefromobject}
   * @param {ExpirationInterval} [options.interval] A specific day of the week
   *   to expire the cache, optionally at a specific time.
   */
  constructor({
    maxAge,
    interval,
    name,
  }: {
    maxAge?: DurationLikeObject;
    interval?: ExpirationInterval;
    name?: string;
  }) {
    this.name = name;
    this._data = null;
    this.expirationDate = null;
    if (!maxAge && !interval) {
      return;
    }
    if (maxAge) {
      const duration = Duration.fromObject(maxAge);
      if (!duration.isValid) {
        throw new Error(
          `Invalid maxAge: ${
            duration.invalidExplanation || "Unknown error"
          } (Code ${duration.invalidReason})`
        );
      }
      this.duration = duration;
    }
    this.interval = interval;
  }

  isExpired(): boolean {
    return (
      !this.data ||
      (this.expirationDate && DateTime.utc() > this.expirationDate)
    );
  }

  _setExpirationDate() {
    let dates: DateTime[] = [];
    if (this.duration) {
      const now = DateTime.utc();
      dates.push(now.plus(this.duration));
    }
    if (this.interval) {
      const now = DateTime.utc();
      const { weekday: weekdayString, hour, minute } = this.interval;
      const weekday = weekdays.get(weekdayString);
      if (!weekday) {
        return;
      }
      let intervalDate = now.set({
        weekday,
        hour: hour || 0,
        minute: minute || 0,
        second: 0,
        millisecond: 0,
      });
      if (intervalDate <= now) {
        intervalDate = intervalDate.plus({ weeks: 1 });
      }
      dates.push(intervalDate);
    }
    this.expirationDate = DateTime.min(...dates);
    console.debug(
      `${this.name || "Unnamed"} cache expiration date set to ${
        this.expirationDate?.toISO() || "null"
      }`
    );
  }
}
