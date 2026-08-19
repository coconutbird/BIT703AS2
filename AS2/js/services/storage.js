/**
 * @file Persistence, guarded so a hostile storage environment cannot break the
 * page.
 *
 * localStorage works on file:// but can still throw - private mode, or a
 * browser set to block site data - so every call falls back to an in-memory
 * Map. The cart then stops surviving a reload instead of the page dying.
 */

(() => {
  "use strict";

  /** @type {Map<string, string>} */
  const memory = new Map();

  /** Probe once at load rather than guessing from the user agent. */
  const available = (() => {
    try {
      const probe = "__store_probe__";
      localStorage.setItem(probe, "1");
      localStorage.removeItem(probe);
      return true;
    } catch {
      return false;
    }
  })();

  /**
   * @memberof Store
   * @namespace Store.storage
   */
  Store.storage = {
    /**
     * @template T
     * @param {string} key
     * @param {T|null} [fallback] returned when the key is absent or unparseable
     * @returns {T|null}
     */
    read(key, fallback = null) {
      let raw;
      try {
        raw = available ? localStorage.getItem(key) : memory.get(key);
      } catch {
        raw = memory.get(key);
      }
      if (raw == null) return fallback;

      try {
        return JSON.parse(raw);
      } catch {
        return fallback;
      }
    },

    /**
     * @param {string} key
     * @param {unknown} value serialised as JSON
     * @returns {boolean} false when the value only reached the memory fallback
     */
    write(key, value) {
      const raw = JSON.stringify(value);
      memory.set(key, raw);
      if (!available) return false;

      try {
        localStorage.setItem(key, raw);
        return true;
      } catch {
        // Quota exceeded, or storage blocked part-way through the session.
        return false;
      }
    },
  };
})();
