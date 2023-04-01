import { prefs } from "./prefs";

class BugsCache {
  constructor({ version } = {}) {
    if (!version) throw new Error("Cache version is required");
    this._opened = false;
    this._version = version;
  }

  _open() {
    if (prefs.get("disable_cache")) return null;
    try {
      const cache = window.caches.open(this._version);
      if (!this._opened) {
        this.update();
        this._opened = true;
      }
      return cache;
    } catch (error) {
      console.debug("Error accessing cache :>> ", error);
      return null;
    }
  }

  async get(request) {
    try {
      const cache = await this._open();
      return cache.match(request.asGet);
    } catch (error) {
      console.debug("Error accessing cache :>> ", error);
      return null;
    }
  }

  async set(request, response) {
    if (!response) return null;
    try {
      const cache = await this._open();
      return cache.put(request.asGet, response.clone());
    } catch (error) {
      console.debug("Error accessing cache :>> ", error);
      return null;
    }
  }

  async delete(request, options) {
    try {
      const cache = await this._open();
      return cache.delete(request.asGet, options);
    } catch (error) {
      console.debug("Error accessing cache :>> ", error);
      return null;
    }
  }

  async purge() {
    if (prefs.get("disable_cache")) return null;
    try {
      const keys = await window.caches.keys();
      return Promise.all(keys.map(key => window.caches.delete(key)));
    } catch (error) {
      console.debug("Error accessing cache :>> ", error);
      return null;
    }
  }

  async update() {
    if (prefs.get("disable_cache")) return null;
    try {
      // Remove caches for old versions
      const keys = await window.caches.keys();
      const toDelete = keys.filter(key => key !== this._version);
      return Promise.all(toDelete.map(key => window.caches.delete(key)));
    } catch (error) {
      console.debug("Error accessing cache :>> ", error);
      return null;
    }
  }
}

/**
 * POST requests are not cacheable, and GET requests are not allowed to have a
 * body. So we convert POST requests to GET requests for the purpose of caching.
 * The real POST request is sent to the server, but within the cache it's keyed
 * by the GET format.
 */
export class CacheableRequest extends Request {
  /**
   * Same as `new Request(input, options)` but with a method to convert to GET.
   * @param {string|Request} input e.g. "/api/bugs"
   * @param {object} options RequestInit options - important ones:
   * @param {HeadersInit} [options.headers] Headers for the request
   * @param {BodyInit} [options.body] e.g. a JSON string
   * @param {string} [options.method] e.g. "POST"
   */
  constructor(
    input,
    {
      body,
      method = "POST",
      headers = {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      ...options
    } = {}
  ) {
    super(input, { ...options, body, method, headers });
    this.path = input;
    this.body = body;
  }

  /**
   * Return this request, converted to a fake GET request, so it can be cached
   * (returns itself if it's already a GET request).
   * @returns {Request|this} A GET request with the same path as the original
   *                         request, but with the body converted to a query
   * @example $ new CacheableRequest("/api/bugs", { body: { id: 1 } }).asGet;
   *          > new Request(`/api/bugs?fakebody={"id":1}`);
   */
  get asGet() {
    if (this.method === "GET") return this;
    return new Request(`${this.path}?fakebody=${this.body}`);
  }
}

export const cache = new BugsCache({ version: "4" });

module.exports = {
  CacheableRequest,
  cache,
};
