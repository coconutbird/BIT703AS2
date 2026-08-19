/**
 * @file Payment page: switching between card and PayPal, card-number
 * formatting and brand detection.
 */

(() => {
  "use strict";

  const { $, $$, ready } = Store.dom;

  /** Card brands, identified by their issuer prefix (IIN). */
  const BRANDS = [
    { test: /^4/, icon: "bi-credit-card-2-front", name: "Visa" },
    { test: /^5[1-5]/, icon: "bi-credit-card-2-front", name: "Mastercard" },
    { test: /^3[47]/, icon: "bi-credit-card", name: "American Express" },
  ];

  /**
   * Enable or disable the card panel when the payment method changes.
   *
   * `disabled` is the part that matters: it removes the fields from the tab
   * order and from validation, so PayPal cannot raise errors on an unused
   * panel. The class is only the visual half.
   */
  const initMethodToggle = () => {
    const cardFields = $("[data-payment-fields]");
    const choices = /** @type {HTMLInputElement[]} */ ($$("[data-payment-method]"));
    if (!cardFields || !choices.length) return;

    const inputs = /** @type {HTMLInputElement[]} */ ($$("input", cardFields));

    /** @param {boolean} enabled */
    const setCardEnabled = (enabled) => {
      cardFields.classList.toggle("is-disabled", !enabled);
      for (const input of inputs) {
        input.disabled = !enabled;
        if (!enabled) {
          input.classList.remove("is-invalid", "is-valid");
          input.removeAttribute("aria-invalid");
        }
      }
    };

    for (const choice of choices) {
      choice.addEventListener("change", () =>
        setCardEnabled(choice.value === "card" && choice.checked),
      );
    }

    setCardEnabled(choices.find((choice) => choice.checked)?.value === "card");
  };

  /** Display formatting only - every rule strips the spaces before checking. */
  const initCardNumber = () => {
    const number = /** @type {HTMLInputElement|null} */ ($("#card-number"));
    const brand = $("[data-payment-brand]");
    if (!number) return;

    number.addEventListener("input", () => {
      const digits = number.value.replace(/\D/g, "").slice(0, 19);
      number.value = digits.replace(/(\d{4})(?=\d)/g, "$1 ");

      const match = BRANDS.find(({ test }) => test.test(digits));
      const icon = brand?.querySelector("i");
      if (icon) {
        icon.className = `bi ${match?.icon ?? "bi-credit-card"}`;
        brand.setAttribute("title", match?.name ?? "Card");
      }
    });
  };

  /**
   * Insert the slash in MM/YY, but only while typing forwards - checking the
   * length lets the customer backspace through the separator normally.
   */
  const initExpiry = () => {
    const expiry = /** @type {HTMLInputElement|null} */ ($("#card-expiry"));

    expiry?.addEventListener("input", () => {
      const digits = expiry.value.replace(/\D/g, "").slice(0, 4);
      expiry.value = digits.length > 2 ? `${digits.slice(0, 2)} / ${digits.slice(2)}` : digits;
    });
  };

  /** Bootstrap tooltips are opt-in; the CVV help icon is the only one here. */
  const initTooltips = () => {
    for (const element of $$('[data-bs-toggle="tooltip"]')) {
      new bootstrap.Tooltip(element);
    }
  };

  ready(() => {
    initMethodToggle();
    initCardNumber();
    initExpiry();
    initTooltips();
  });
})();
