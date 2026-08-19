/**
 * @file A tiny publish/subscribe helper, so the cart, the header badge and the
 * page summaries can react to a change without knowing about one another.
 */

(() => {
  "use strict";

  /** @type {Map<string, Array<(payload: any) => void>>} */
  const subscribers = new Map();

  /**
   * @memberof Store
   * @namespace Store.bus
   */
  Store.bus = {
    /**
     * @param {string} event e.g. `"cart:changed"`
     * @param {(payload: any) => void} handler
     */
    on(event, handler) {
      if (!subscribers.has(event)) subscribers.set(event, []);
      subscribers.get(event).push(handler);
    },

    /**
     * @param {string} event
     * @param {any} [payload]
     */
    emit(event, payload) {
      for (const handler of subscribers.get(event) ?? []) {
        // One broken subscriber must not stop the others running.
        try {
          handler(payload);
        } catch (error) {
          console.error(`Store handler failed for ${event}`, error);
        }
      }
    },
  };
})();
