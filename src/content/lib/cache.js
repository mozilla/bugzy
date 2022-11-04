import { prefs } from "./prefs";

class Cache {
  constructor({ version } = {}) {
    if (!version) {
      throw new Error("Cache version is required");
    }
    this._opened = false;
    this._version = version;
  }

  _open() {
    if (prefs.get("disable_cache")) {
      return null;
    }
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
      return cache && cache.match(request);
    } catch (error) {
      console.debug("Error accessing cache :>> ", error);
      return null;
    }
  }

  async set(request, response) {
    if (!response) {
      return false;
    }
    try {
      const cache = await this._open();
      return cache && cache.put(request, response.clone());
    } catch (error) {
      console.debug("Error accessing cache :>> ", error);
      return null;
    }
  }

  async delete(request, options) {
    try {
      const cache = await this._open();
      return cache && cache.delete(request, options);
    } catch (error) {
      console.debug("Error accessing cache :>> ", error);
      return null;
    }
  }

  async purge() {
    if (prefs.get("disable_cache")) {
      return null;
    }
    try {
      const keys = await window.caches.keys();
      return Promise.all(keys.map(key => window.caches.delete(key)));
    } catch (error) {
      console.debug("Error accessing cache :>> ", error);
      return null;
    }
  }

  async update() {
    if (prefs.get("disable_cache")) {
      return null;
    }
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

export const cache = new Cache({ version: "1" });

module.exports.cache = cache;
