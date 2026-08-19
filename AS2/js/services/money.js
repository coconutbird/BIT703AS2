/**
 * @file Money handling.
 *
 * Every amount is an integer number of CENTS, formatted only at render.
 * Floats cannot represent 0.1 exactly, so accumulating them drifts a cent.
 */

(() => {
  "use strict";

  /**
   * @memberof Store
   * @namespace Store.money
   */
  Store.money = {
    /**
     * Format cents for display.
     *
     * @param {number} cents
     * @returns {string} e.g. `format(123456)` -> `"$1,234.56"`
     */
    format: (cents) =>
      `$${(Math.round(Number(cents) || 0) / 100).toLocaleString("en-NZ", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,

    /**
     * The GST already inside a GST-inclusive amount.
     *
     * NZ prices include GST, so it is extracted, not added: at 15% the tax
     * portion is total x 15/115, not total x 0.15.
     *
     * @see https://www.ird.govt.nz/gst/charging-gst
     * @param {number} cents a GST-inclusive amount
     * @returns {number} the GST component, rounded to the nearest cent
     */
    gstIncludedIn(cents) {
      const rate = Store.config.gstRate;
      return Math.round((cents * rate) / (1 + rate));
    },
  };
})();
