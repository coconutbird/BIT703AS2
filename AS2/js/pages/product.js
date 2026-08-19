/**
 * @file Product detail page: pick the product from `?id=` and publish it to
 * the Alpine stores, which render the similar-products strip and reviews.
 */

(() => {
  "use strict";

  const { $, el, setText, fallbackImage, ready } = Store.dom;
  const { money, catalogue, ui, cart } = Store;

  /**
   * Fill the one-off details, which are set directly rather than declared.
   *
   * @param {Product} product
   */
  const fillDetails = (product) => {
    document.title = `${product.name} | Aotearoa Adventure Gear`;

    const image = /** @type {HTMLImageElement} */ ($("[data-product-image]"));
    if (image) {
      image.src = product.image;
      image.alt = product.name;
      fallbackImage(image);
    }

    setText($("[data-product-name]"), product.name);
    setText($("[data-product-price]"), money.format(product.price));
    setText($("[data-product-description]"), product.description);
    setText(
      $("[data-product-review-count]"),
      `${product.reviewCount} ${product.reviewCount === 1 ? "review" : "reviews"}`,
    );

    ui.renderStars($("[data-product-stars]"), product.rating, product.reviewCount);

    const models = /** @type {HTMLSelectElement|null} */ ($("[data-product-models]"));
    models?.append(
      ...product.models.map((name) => el("option", { text: name, attrs: { value: name } })),
    );

    $("#product-qty")?.setAttribute("data-max-stock", String(product.stock));
  };

  /** @param {Product} product */
  const publishLists = (product) => {
    const store = window.Alpine?.store("catalogue");
    if (!store) return;

    const sameCategory = catalogue
      .all()
      .filter((other) => other.id !== product.id && other.category === product.category);

    // Fall back to any other products when the category has no siblings, so
    // the section is never empty.
    const pool = sameCategory.length
      ? sameCategory
      : catalogue.all().filter((other) => other.id !== product.id);

    store.similar = pool.slice(0, 3);

    // The display date is formatted here so the markup stays free of logic.
    store.reviews = catalogue.reviewsFor(product.id).map((review) => ({
      ...review,
      displayDate: new Date(review.date).toLocaleDateString("en-NZ", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    }));
  };

  ready(() => {
    /* ?id= chooses the product; an unknown or missing id falls back to the
       first catalogue item rather than rendering an empty page. */
    const id = new URLSearchParams(window.location.search).get("id");
    const product = catalogue.byId(id) ?? catalogue.all()[0];
    if (!product) return;

    fillDetails(product);
    publishLists(product);

    // "form:valid" is only emitted once every validation rule has passed.
    Store.bus.on("form:valid", ({ form }) => {
      if (form.getAttribute("data-validate") !== "add-to-cart") return;

      const qty = Number.parseInt(/** @type {HTMLInputElement} */ ($("#product-qty")).value, 10);
      cart.add(product.id, qty);
    });
  });
})();
