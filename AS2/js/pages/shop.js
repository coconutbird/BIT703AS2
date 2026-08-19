/**
 * @file Shop page: the live search filter.
 *
 * The tiles and grid are declared in `shop.html` and repeated by Alpine; this
 * only decides which products belong in `$store.catalogue.filtered`.
 */

(() => {
  "use strict";

  const { $, ready } = Store.dom;
  const { catalogue } = Store;

  /**
   * Hand a product list to Alpine.
   *
   * Alpine is loaded with `defer`, so it has already started by the time this
   * runs. The store is still read lazily, so a load-order change cannot
   * silently break it.
   *
   * @param {Product[]} products
   */
  const show = (products) => {
    const store = window.Alpine?.store("catalogue");
    if (store) store.filtered = products;
  };

  /**
   * Seed the grid from `?q=` or `?category=`, so a search submitted from the
   * header arrives already filtered. URLSearchParams makes no request, so it
   * works on file://.
   *
   * @returns {string} the search term, for pre-filling the input
   */
  const applyQueryString = () => {
    const params = new URLSearchParams(window.location.search);
    const term = params.get("q") ?? "";
    const category = params.get("category");

    if (term) {
      show(catalogue.search(term));
    } else if (category) {
      show(catalogue.all().filter((product) => product.category === category));
    }

    return term;
  };

  /**
   * Cheap because the catalogue is a handful of objects in memory; thousands
   * would need debouncing or a server.
   *
   * @param {string} term seeded from the query string, if any
   */
  const initSearch = (term) => {
    const input = /** @type {HTMLInputElement|null} */ ($("[data-shop-search]"));
    if (!input) return;

    if (term) input.value = term;

    input.addEventListener("input", () => show(catalogue.search(input.value)));

    input.form?.addEventListener("submit", (event) => {
      event.preventDefault();
      show(catalogue.search(input.value));
    });
  };

  ready(() => {
    initSearch(applyQueryString());
  });
})();
