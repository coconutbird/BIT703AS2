/**
 * @file Cart state, persistence and order totals - the single source of truth
 * for what is in the cart and what it costs. Every page re-renders on
 * "cart:changed", so none of them can disagree.
 */

/**
 * @typedef {object} CartLine
 * @property {string}  id
 * @property {number}  qty
 * @property {Product} product
 * @property {number}  lineTotal  cents
 */

/**
 * @typedef {object} Totals
 * @property {number}  subtotal   goods before discount, cents
 * @property {number}  discount   cents
 * @property {number}  goods      subtotal minus discount
 * @property {number}  shipping   cents, 0 when free
 * @property {number}  gst        GST contained in the total, cents
 * @property {number}  total      goods + shipping (GST already inside)
 * @property {number}  count      total item quantity
 * @property {string|null} coupon applied code
 * @property {string|null} couponLabel  e.g. "10% off"
 * @property {"standard"|"nextday"} delivery
 * @property {boolean} freeShipping     order qualifies
 * @property {number}  remainingForFreeShipping  cents still to spend
 */

(() => {
  "use strict";

  const { config, storage, money, bus, catalogue } = Store;

  /**
   * Discount codes. Hard-coded is fine for a client-side only site, but a real
   * store validates codes server-side - everything in this file is visible to
   * and editable by the customer.
   */
  const COUPONS = Object.freeze({
    KIAORA10: { type: "percent", value: 10, label: "10% off" },
    TRAMP25: { type: "fixed", value: 2_500, label: "$25 off" },
  });

  /**
   * Stored shape: { lines: [{ id, qty }], coupon, delivery }.
   *
   * Never the price - prices are looked up from the catalogue at calculation
   * time, so a stale or tampered entry cannot inject one.
   */
  const emptyCart = () => ({ lines: [], coupon: null, delivery: "standard" });

  /**
   * Validate whatever came out of storage before trusting it. Anything from
   * localStorage is user-controlled input and gets checked like a form field.
   *
   * @param {unknown} raw
   */
  const sanitise = (raw) => {
    const cart = emptyCart();
    if (!raw || typeof raw !== "object") return cart;

    for (const line of Array.isArray(raw.lines) ? raw.lines : []) {
      const product = typeof line?.id === "string" ? catalogue.byId(line.id) : null;
      if (!product) continue; // product withdrawn since the cart was saved

      const qty = Number.parseInt(line.qty, 10);
      if (!Number.isFinite(qty) || qty < 1) continue;

      cart.lines.push({ id: product.id, qty: Math.min(qty, product.stock) });
    }

    if (typeof raw.coupon === "string" && /^[A-Z0-9]{4,12}$/i.test(raw.coupon)) {
      cart.coupon = raw.coupon.toUpperCase();
    }

    if (raw.delivery === "nextday" || raw.delivery === "standard") {
      cart.delivery = raw.delivery;
    }

    return cart;
  };

  /** @type {ReturnType<typeof emptyCart>|null} */
  let state = null;

  const load = () => (state ??= sanitise(storage.read(config.storageKey)));

  const persist = () => {
    storage.write(config.storageKey, state);
    bus.emit("cart:changed", Store.cart.totals());
  };

  /**
   * @memberof Store
   * @namespace Store.cart
   */
  Store.cart = {
    /** @returns {CartLine[]} each line joined to its catalogue product */
    lines: () =>
      load().lines.map(({ id, qty }) => {
        const product = catalogue.byId(id);
        return { id, qty, product, lineTotal: product.price * qty };
      }),

    /** @returns {number} total quantity across all lines */
    count: () => load().lines.reduce((sum, { qty }) => sum + qty, 0),

    /** @returns {string|null} */
    coupon: () => load().coupon,

    /** @returns {"standard"|"nextday"} */
    delivery: () => load().delivery,

    /**
     * @param {string} productId
     * @param {number} [qty]
     * @returns {boolean} false when the product id is unknown
     */
    add(productId, qty = 1) {
      const product = catalogue.byId(productId);
      if (!product) return false;

      const wanted = Math.max(1, Number.parseInt(String(qty), 10) || 1);
      const cart = load();
      const existing = cart.lines.find((line) => line.id === productId);

      if (existing) {
        existing.qty = Math.min(existing.qty + wanted, product.stock);
      } else {
        cart.lines.push({ id: productId, qty: Math.min(wanted, product.stock) });
      }

      persist();
      return true;
    },

    /**
     * Set a line's quantity. Zero removes the line, which is what the spinner
     * does stepping down past 1.
     *
     * @param {string} productId
     * @param {number|string} qty
     * @returns {boolean}
     */
    setQty(productId, qty) {
      const product = catalogue.byId(productId);
      if (!product) return false;

      const wanted = Number.parseInt(String(qty), 10);
      if (!Number.isFinite(wanted) || wanted < 0) return false;
      if (wanted === 0) return Store.cart.remove(productId);

      const line = load().lines.find((item) => item.id === productId);
      if (!line) return false;

      line.qty = Math.min(wanted, product.stock);
      persist();
      return true;
    },

    /**
     * @param {string} productId
     * @returns {boolean}
     */
    remove(productId) {
      const cart = load();
      cart.lines = cart.lines.filter((line) => line.id !== productId);
      persist();
      return true;
    },

    /**
     * @param {"standard"|"nextday"} method
     * @returns {boolean}
     */
    setDelivery(method) {
      if (method !== "standard" && method !== "nextday") return false;
      load().delivery = method;
      persist();
      return true;
    },

    /**
     * @param {string} code
     * @returns {{ok: boolean, message: string}} a result object rather than a
     *   bare boolean, so the page can show a specific message
     */
    applyCoupon(code) {
      const normalised = String(code ?? "")
        .trim()
        .toUpperCase();
      if (!normalised) return { ok: false, message: "Enter a coupon code." };

      if (!Object.hasOwn(COUPONS, normalised)) {
        return { ok: false, message: "That coupon code is not valid." };
      }

      const cart = load();
      if (cart.coupon === normalised) {
        return { ok: false, message: "That coupon is already applied." };
      }

      cart.coupon = normalised;
      persist();
      return { ok: true, message: `${COUPONS[normalised].label} applied.` };
    },

    /**
     * The one place order money is calculated:
     * subtotal -> discount -> shipping -> total, with GST extracted from it.
     *
     * @returns {Totals}
     */
    totals() {
      const cart = load();
      const subtotal = Store.cart.lines().reduce((sum, { lineTotal }) => sum + lineTotal, 0);

      const coupon = cart.coupon ? COUPONS[cart.coupon] : null;
      const discount = !coupon
        ? 0
        : coupon.type === "percent"
          ? Math.round(subtotal * (coupon.value / 100))
          : Math.min(coupon.value, subtotal); // never discount below zero

      const goods = subtotal - discount;

      /* Against the discounted total: a coupon that drops the order below
         the threshold means $600 was not actually spent. */
      const freeShipping = goods >= config.freeShippingThreshold;

      /* Next-day is an upgrade and stays chargeable even on a qualifying
         order - the wireframe prices it separately at $20. */
      const shipping =
        cart.delivery === "nextday"
          ? config.nextDayShipping
          : freeShipping
            ? 0
            : config.standardShipping;

      /* Prices already include GST, so the total is simply goods plus
         shipping. The GST figure is reported for information only. */
      const total = goods + shipping;
      const gst = money.gstIncludedIn(total);

      return {
        subtotal,
        discount,
        goods,
        shipping,
        gst,
        total,
        count: Store.cart.count(),
        coupon: cart.coupon,
        couponLabel: coupon?.label ?? null,
        delivery: cart.delivery,
        freeShipping,
        remainingForFreeShipping: Math.max(0, config.freeShippingThreshold - goods),
      };
    },
  };
})();
