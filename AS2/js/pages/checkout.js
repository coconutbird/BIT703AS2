/**
 * @file Checkout interactions: cart line controls and the coupon forms.
 *
 * The lines and summary are declared in the markup and driven by Alpine. Only
 * events remain here: `data-x-on:click` would need a colon, which a `data-*`
 * name may not contain. Delegated listeners also survive re-rendering.
 */

(() => {
  "use strict";

  const { $, $$, setText, ready } = Store.dom;
  const { cart, validate } = Store;

  /**
   * The id of the cart line an element sits inside.
   *
   * @param {Element} element
   * @returns {string|undefined}
   */
  const lineIdFor = (element) => element.closest("[data-cart-line-id]")?.dataset.cartLineId;

  const initCartLines = () => {
    const list = $("[data-cart-list]");
    if (!list) return;

    list.addEventListener("click", (event) => {
      const button = event.target.closest("[data-cart-remove]");
      if (!button) return;

      const id = lineIdFor(button);
      if (id) cart.remove(id);
    });

    /* "change" rather than "input": committing on every keystroke would
       re-render the row mid-edit and take focus with it. */
    list.addEventListener("change", (event) => {
      const input = event.target.closest("[data-cart-qty]");
      if (!input) return;

      const message = validate.check(input);
      validate.paint(input, message);
      if (message) return;

      const id = lineIdFor(input);
      if (id) cart.setQty(id, input.value);
    });
  };

  /** Coupon forms - the open one on cart.html, the voucher panel elsewhere. */
  const initCouponForms = () => {
    for (const form of $$("form[data-validate='coupon']")) {
      form.addEventListener("submit", (event) => {
        event.preventDefault();

        const input = /** @type {HTMLInputElement} */ (form.querySelector("input[name='coupon']"));
        const status = form.querySelector("[data-form-status]");

        const message = validate.check(input);
        validate.paint(input, message);
        if (message) return;

        const result = cart.applyCoupon(input.value);
        setText(status, result.message);
        status?.classList.toggle("is-success", result.ok);
        if (result.ok) input.value = "";
      });
    }
  };

  ready(() => {
    initCartLines();
    initCouponForms();
  });
})();
