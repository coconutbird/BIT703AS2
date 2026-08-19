/**
 * @file Star rating rendering.
 */

(() => {
  "use strict";

  const { el, setText } = Store.dom;

  Store.ui ??= {};

  /**
   * Render a 0-5 star rating.
   *
   * Icons are aria-hidden - "star star star" read aloud is meaningless - and a
   * visually hidden span carries the value instead.
   *
   * @memberof Store.ui
   * @param {HTMLElement|null} container
   * @param {number} rating 0-5, halves allowed
   * @param {number} [reviewCount]
   */
  Store.ui.renderStars = (container, rating, reviewCount) => {
    if (!container) return;

    const value = Math.max(0, Math.min(5, Number(rating) || 0));
    container.replaceChildren();

    for (let position = 1; position <= 5; position += 1) {
      const shape =
        value >= position ? "bi-star-fill" : value >= position - 0.5 ? "bi-star-half" : "bi-star";

      container.append(
        el("i", { class: `bi ${shape} gear-stars__icon`, attrs: { "aria-hidden": "true" } }),
      );
    }

    const label = el("span", { class: "visually-hidden" });
    setText(label, `Rated ${value} out of 5${reviewCount ? ` from ${reviewCount} reviews` : ""}`);
    container.append(label);
  };
})();
