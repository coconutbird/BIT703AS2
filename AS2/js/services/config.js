/**
 * @file Creates the one global the whole site hangs off, and the business
 * rules several modules need. Must be the first custom script on a page.
 *
 * ES modules cannot be used - a module script is fetched under CORS rules and
 * a file:// page has an opaque origin - so each file is an IIFE that adds to
 * one namespace instead of exporting.
 */

/**
 * The one global. Later files add to it: Store.cart, Store.money,
 * Store.validate.
 *
 * @global
 * @namespace Store
 */
window.Store ??= {};

(() => {
  "use strict";

  /**
   * Business rules, named so they can be checked in one place.
   *
   * @memberof Store
   */
  Store.config = Object.freeze({
    /**
     * Free shipping cut-off, in cents. The brief says "over $600", the
     * wireframe shows FREE at exactly $600 - hence >=, with the UI wording
     * "$600 or more". Measured on the goods subtotal.
     */
    freeShippingThreshold: 60_000,

    /** Standard delivery, charged below the threshold. */
    standardShipping: 950,

    /** Next-day upgrade, priced by the shipping wireframe. */
    nextDayShipping: 2_000,

    /**
     * NZ GST. Retail prices here are GST-inclusive, so nothing is added at
     * checkout - the summary reports the portion already inside the total.
     */
    gstRate: 0.15,

    /** localStorage key. Versioned, so a future shape change can migrate. */
    storageKey: "gear.cart.v1",
  });
})();
