/**
 * @file Page shell behaviour present on every page.
 *
 * The cart badge used to be rendered here. It is now declared in the masthead
 * markup and kept in step by Alpine - see js/services/alpine.js.
 */

(() => {
  "use strict";

  const { $$, setText, ready } = Store.dom;

  /** Avoids a hard-coded year going stale in the footer. */
  ready(() => {
    for (const node of $$("[data-current-year]")) {
      setText(node, new Date().getFullYear());
    }
  });
})();
