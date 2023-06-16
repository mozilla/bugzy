import { DateTime, Duration, DurationObject } from "luxon";

/** A memory "cache" for small server data, used to avoid querying Bugzilla. */
export class ServerCache {
  _data: any;
  duration: Duration | null;
  expirationDate: DateTime | null;
  set data(data: any) {
    this._data = data;
    this._setExpirationDate();
  }
  get data() {
    return this._data;
  }
  /**
   * @param {DurationObject} maxAge How long to cache the data for. If null, the
   *    cached data will not expire until the server is restarted.
   * @see {@link https://moment.github.io/luxon/api-docs/index.html#datetimefromobject Duration.fromObject}
   */
  constructor(maxAge: DurationObject | void) {
    this.data = null;
    this.duration = null;
    this.expirationDate = null;
    if (maxAge) {
      const duration = Duration.fromObject(maxAge);
      if (!duration.isValid) {
        return;
      }
      this.duration = duration;
      this._setExpirationDate();
    }
  }
  isExpired(): boolean {
    return (
      !this.data ||
      (this.expirationDate && DateTime.local() > this.expirationDate)
    );
  }
  _setExpirationDate() {
    if (this.duration) {
      const now = DateTime.local();
      this.expirationDate = now.plus(this.duration);
    }
  }
}
