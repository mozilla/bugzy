// const Store = window.require('electron-store');
const prefDefaults = {
  // The user's bugzilla email
  bugzilla_email: "",
  // Disable all client-side network requests
  offline_debug: false,
  // Disable the user cache for bug views
  disable_cache: false,
  // Bugzilla API endpoint
  // For testing that requires manipulation of Bugzilla data such as creating or updating bugs, switch to the staging API endpoint
  // root_url: "https://bugzilla-dev.allizom.org"
  root_url: "https://bugzilla.mozilla.org",
};

class Store {
  get(key, defaultValue) {
    if (localStorage.getItem(key) === null && key in prefDefaults) {
      this.set(key, defaultValue);
    }
    return JSON.parse(localStorage.getItem(key));
  }

  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  delete(key) {
    localStorage.removeItem(key);
  }

  has(key) {
    return localStorage.getItem(key) !== null;
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
