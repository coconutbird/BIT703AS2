/**
 * @file Shipping page: the free-shipping rule (Task 2a) and the delivery
 * method radios.
 */

(() => {
  "use strict";

  const { $, setText, ready } = Store.dom;
  const { money, cart, config } = Store;

  /**
   * Show the standard option's price and the prompt beneath the radios.
   *
   * @param {Totals} totals
   */
  const render = (totals) => {
    setText(
      $("[data-delivery-price]"),
      totals.freeShipping ? "FREE" : `- ${money.format(config.standardShipping)}`,
    );

    const notice = $("[data-delivery-notice]");
    if (!notice) return;

    notice.hidden = totals.goods === 0;
    notice.classList.toggle("is-earned", totals.freeShipping);

    if (totals.freeShipping) {
      setText(notice, "Free standard shipping applied - your order is over $600.");
      return;
    }

    setText(
      notice,
      `Add ${money.format(totals.remainingForFreeShipping)} more to qualify for free standard shipping.`,
    );
  };

  /**
   * Select standard delivery once the cart qualifies, so the customer gets it
   * without noticing. Skipped once they have chosen next-day.
   *
   * @param {Totals} totals
   */
  const autoSelect = (totals) => {
    const standard = /** @type {HTMLInputElement|null} */ ($("[data-delivery-standard]"));
    const nextDay = /** @type {HTMLInputElement|null} */ ($("#delivery-nextday"));

    if (totals.freeShipping && standard && !nextDay?.checked) standard.checked = true;
  };

  /** Record the chosen method, and restore whatever was chosen last visit. */
  const initRadios = () => {
    const standard = /** @type {HTMLInputElement|null} */ ($("[data-delivery-standard]"));
    const nextDay = /** @type {HTMLInputElement|null} */ ($("#delivery-nextday"));
    if (!standard) return;

    for (const radio of [standard, nextDay].filter(Boolean)) {
      radio.addEventListener("change", () => {
        if (radio.checked) cart.setDelivery(radio.value);
      });
    }

    if (cart.delivery() === "nextday" && nextDay) nextDay.checked = true;
    else standard.checked = true;
  };

  ready(() => {
    if (!$("[data-delivery-standard]")) return;

    initRadios();

    Store.bus.on("cart:changed", (totals) => {
      autoSelect(totals);
      render(totals);
    });

    const totals = cart.totals();
    autoSelect(totals);
    render(totals);
  });
})();
