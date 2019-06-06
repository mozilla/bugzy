// const Store = window.require('electron-store');
import prefDefaults from "../../config/pref_defaults";

class Store {
  get(key) {
    return localStorage.getItem(key);
  }

  set(key, value) {
    localStorage.setItem(key, value);
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

const prefs = new Prefs({ store: new Store() });

module.exports.prefs = prefs;
