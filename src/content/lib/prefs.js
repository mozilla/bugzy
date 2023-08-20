const prefDefaults = {
  // The user's bugzilla email
  bugzilla_email: "",
  // Disable all client-side network requests
  offline_debug: false,
  // Disable the user cache for bug views
  disable_cache: false,
  // Keep priority guide open on start
  priority_guide_open: true,
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
      if (storedValue) {
        this.set(pref, value ?? def ?? prefDefaults[pref]);
      }
    }
    return value ?? def ?? prefDefaults[pref];
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
    const oldValue = this.get(name);
    if (oldValue !== value) {
      this._store.set(name, value);
      this._emit(name, oldValue, value);
    }
  }

  reset(name) {
    const oldValue = this.get(name);
    const newValue = this._defaults[name];
    this._store.delete(name);
    if (oldValue !== newValue) {
      this._emit(name, oldValue, newValue);
    }
  }

  isUserSet(name) {
    return this._store.has(name);
  }

  on(name, listener) {
    if (!this._listeners) {
      this._listeners = new Map();
    }
    if (!this._listeners.has(name)) {
      this._listeners.set(name, new Set());
    }
    this._listeners.get(name).add(listener);
  }

  once(name, listener) {
    const handler = (...args) => {
      this.off(name, handler);
      this._apply(listener, ...args);
    };
    handler._originalListener = listener;
    this.on(name, handler);
  }

  off(name, listener) {
    if (this._listeners?.has(name)) {
      const listeners = this._listeners.get(name);
      if (listeners) {
        let deleted = listeners.delete(listener);
        if (!deleted) {
          // If the listener was wrapped in a once() handler, try to remove the
          // original listener instead.
          for (const l of listeners) {
            if (l._originalListener === listener) {
              listeners.delete(l);
              break;
            }
          }
        }
      }
    }
  }

  _emit(name, oldValue, newValue) {
    if (this._listeners?.has(name)) {
      for (const listener of this._listeners.get(name)) {
        this._apply(listener, { name, oldValue, newValue });
      }
    }
  }

  _apply(listener, data) {
    if (typeof listener === "function") {
      listener(data);
    } else if (listener?.onPrefChange) {
      listener.onPrefChange(data);
    } else if (listener) {
      console.error("Invalid pref listener", listener);
    } else {
      console.error("Missing pref listener");
    }
  }
}

export const prefs = new Prefs({ store: new Store() });
