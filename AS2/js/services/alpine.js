/**
 * @file Alpine.js setup: attribute prefix, reactive stores and helpers.
 *
 * The prefix is data-x-, not x-: x-data is not a valid HTML attribute and the
 * validator rejects it. That also rules out directives whose names contain a
 * colon (x-on:click, x-bind:href), because a data-* name may not have one - so
 * attributes are set with data-x-effect and events use delegated listeners.
 *
 * Alpine is deferred, so it starts after this registers its alpine:init hook.
 *
 * @see https://alpinejs.dev/advanced/csp
 * @see https://html.spec.whatwg.org/multipage/dom.html#attr-data-* - a custom
 *   data attribute name must be XML-compatible, which excludes colons
 */

(() => {
  "use strict";

  document.addEventListener("alpine:init", () => {
    // Must happen before Alpine walks the DOM looking for directives.
    Alpine.prefix("data-x-");

    /**
     * Format cents from inside markup: `data-x-text="$money(line.price)"`.
     */
    Alpine.magic("money", () => (cents) => Store.money.format(cents));

    /**
     * The cart, mirrored for the markup to react to.
     *
     * services/cart.js stays the source of truth; this holds a display-ready
     * copy, refreshed when the cart announces a change.
     */
    Alpine.store("cart", {
      /** @type {Array<object>} */
      lines: [],
      /** @type {Totals} */
      totals: Store.cart.totals(),

      refresh() {
        this.lines = Store.cart.lines().map(({ id, qty, product, lineTotal }) => ({
          id,
          qty,
          lineTotal,
          name: product.name,
          blurb: product.blurb,
          price: product.price,
          image: product.image,
          stock: product.stock,
          qtyId: `qty-${id}`,
          errorId: `qty-${id}-error`,
          quantityLabel: `Quantity of ${product.name}`,
          removeLabel: `Remove ${product.name} from your cart`,
          summaryLine: `${qty} x ${Store.money.format(product.price)}`,
        }));

        this.totals = Store.cart.totals();
      },

      get isEmpty() {
        return this.lines.length === 0;
      },

      /** Shipping shows as a word when it is free, per the wireframe. */
      get shippingLabel() {
        return this.totals.shipping === 0 ? "FREE" : Store.money.format(this.totals.shipping);
      },

      get couponLabel() {
        return this.totals.couponLabel ? `(${this.totals.coupon})` : "";
      },
    });

    Alpine.store("cart").refresh();

    /** The catalogue never changes at runtime, so it is copied in once. */
    Alpine.store("catalogue", {
      products: Store.catalogue.all(),
      categories: Store.catalogue.categories(),
      /** @type {Product[]} filled by the page that needs it */
      filtered: Store.catalogue.all(),
      /** @type {Product[]} */
      similar: [],
      /** @type {Review[]} */
      reviews: [],

      get noMatches() {
        return this.filtered.length === 0;
      },

      /** The home page shows one large tile beside four smaller ones. Both
       *  render through the same partial, so this is a one-item list. */
      get homeFeature() {
        return this.products.slice(0, 1);
      },

      get homeGrid() {
        return this.products.slice(1, 5);
      },

      productHref: (product) => `product.html?id=${encodeURIComponent(product.id)}`,
      categoryHref: (category) => `shop.html?category=${encodeURIComponent(category.name)}`,
    });
  });

  /* One bridge from the existing event bus into Alpine. Alpine may not have
     started when the first change fires, hence the guard. */
  Store.bus.on("cart:changed", () => {
    window.Alpine?.store("cart")?.refresh();
  });
})();
