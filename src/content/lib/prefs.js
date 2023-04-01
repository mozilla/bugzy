// const Store = window.require('electron-store');
const prefDefaults = {
  // The user's bugzilla email
  bugzilla_email: "",
  // Disable all client-side network requests
  offline_debug: false,
  // Disable the user cache for bug views
  disable_cache: false,
};

class Store {
  get(pref, def) {
    let storedValue = globalThis.localStorage?.getItem(pref);
    let value;
    try {
      value = JSON.parse(storedValue ?? "null");
    } catch (error) {
      // If the stored value is not valid JSON, try to fix it.
      switch (typeof (def ?? prefDefaults[pref])) {
        case "boolean":
          value = storedValue === "true";
          break;
        case "number":
          value = Number(storedValue);
          break;
        default:
          value = storedValue;
      }
      value = value ?? def ?? prefDefaults[pref];
      if (storedValue) {
        this.set(pref, value);
      }
    }
    return value;
  }

  set(key, value) {
    globalThis.localStorage?.setItem(key, JSON.stringify(value));
  }

  delete(key) {
    globalThis.localStorage?.removeItem(key);
  }

  has(key) {
    return globalThis.localStorage?.getItem(key) !== null;
  }
}

class Prefs {
  constructor({ store, defaults = prefDefaults }) {
    this._store = store;
    this._defaults = defaults;
  }

  get(name) {
    return this._store.get(name, this._defaults[name]);
  }

  set(name, value) {
    return this._store.set(name, value);
  }

  reset(name) {
    return this._store.delete(name);
  }

  isUserSet(name) {
    return this._store.has(name);
  }
}

export const prefs = new Prefs({ store: new Store() });

module.exports.prefs = prefs;
