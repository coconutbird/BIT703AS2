/**
 * @file Home page: the featured-products carousel.
 *
 * The grid below it is declared in `index.html` and repeated by Alpine. The
 * carousel is not a plain list - Bootstrap moves one slide at a time, so two
 * products per slide means grouping, and the grouping changes with the
 * breakpoint.
 */

(() => {
  "use strict";

  const { $, el, setText, fallbackImage, ready } = Store.dom;
  const { catalogue, money } = Store;

  /** Featured products carousel (Task 2a). */
  const initCarousel = () => {
    const root = $("#featured-carousel");
    if (!root) return;

    const inner = $("[data-carousel-track]", root);
    const indicators = $("[data-carousel-indicators]", root);
    const products = catalogue.featured();
    if (!products.length) return;

    const wide = window.matchMedia("(min-width: 992px)");

    /** @type {import("bootstrap").Carousel|null} */
    let instance = null;

    /**
     * `chunk([1,2,3], 2)` -> `[[1,2],[3]]`
     *
     * @param {Product[]} items
     * @param {number} size
     * @returns {Product[][]}
     */
    const chunk = (items, size) =>
      Array.from({ length: Math.ceil(items.length / size) }, (_, i) =>
        items.slice(i * size, i * size + size),
      );

    /**
     * One product inside a slide, cloned from the <template> in index.html.
     *
     * @param {Product} product
     * @param {string} columnClass
     * @returns {HTMLElement}
     */
    const buildFigure = (product, columnClass) => {
      const template = document.getElementById("tpl-carousel-figure");
      const column = template.content.firstElementChild.cloneNode(true);
      column.className = columnClass;

      const image = column.querySelector("[data-carousel-image]");
      image.src = product.image;
      image.alt = product.name;
      fallbackImage(image);

      column.querySelector("[data-carousel-link]").href =
        `product.html?id=${encodeURIComponent(product.id)}`;
      setText(column.querySelector("[data-carousel-name]"), product.name);
      setText(column.querySelector("[data-carousel-price]"), money.format(product.price));

      return column;
    };

    /**
     * @param {Product[]} group products for this slide
     * @param {boolean} isFirst the first slide starts active
     * @returns {HTMLElement}
     */
    const buildSlide = (group, isFirst) => {
      const item = el("div", { class: `carousel-item${isFirst ? " active" : ""}` });
      const row = el("div", { class: "row g-4 justify-content-center" });
      const columnClass = group.length > 1 ? "col-md-6" : "col-12 col-md-8";

      row.append(...group.map((product) => buildFigure(product, columnClass)));
      item.append(row);
      return item;
    };

    /**
     * @param {number} index
     * @param {number} total
     * @returns {HTMLElement}
     */
    const buildIndicator = (index, total) => {
      const dot = el("button", {
        class: index === 0 ? "active" : "",
        attrs: {
          type: "button",
          "data-bs-target": "#featured-carousel",
          "data-bs-slide-to": String(index),
          "aria-label": `Slide ${index + 1} of ${total}`,
        },
      });
      if (index === 0) dot.setAttribute("aria-current", "true");
      return dot;
    };

    const render = () => {
      const groups = chunk(products, wide.matches ? 2 : 1);

      instance?.dispose();
      instance = null;

      inner.replaceChildren(...groups.map((group, index) => buildSlide(group, index === 0)));
      indicators.replaceChildren(...groups.map((_, index) => buildIndicator(index, groups.length)));

      instance = new bootstrap.Carousel(root, { interval: 6000, pause: "hover" });
    };

    render();
    wide.addEventListener("change", render);
  };

  ready(initCarousel);
})();
