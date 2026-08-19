/**
 * @file Thin DOM helpers that keep the calling code readable.
 */

(() => {
  "use strict";

  /**
   * @memberof Store
   * @namespace Store.dom
   */
  Store.dom = {
    /**
     * @param {string} selector
     * @param {ParentNode} [scope]
     * @returns {HTMLElement|null}
     */
    $: (selector, scope = document) => scope.querySelector(selector),

    /**
     * @param {string} selector
     * @param {ParentNode} [scope]
     * @returns {HTMLElement[]} a real array, so map/filter are available
     */
    $$: (selector, scope = document) => [...scope.querySelectorAll(selector)],

    /**
     * Set text safely.
     *
     * textContent, never innerHTML: a value containing a script tag is written
     * as characters rather than parsed as markup.
     *
     * @param {Element|null|undefined} element
     * @param {string|number|null|undefined} value
     */
    setText(element, value) {
      if (element) element.textContent = String(value ?? "");
    },

    /**
     * Build an element in one call.
     *
     * @param {string} tag
     * @param {{class?: string, text?: string|number, attrs?: Record<string, string>}} [options]
     * @returns {HTMLElement}
     */
    el(tag, { class: className, text, attrs } = {}) {
      const node = document.createElement(tag);
      if (className) node.className = className;
      if (text != null) node.textContent = String(text);
      for (const [name, value] of Object.entries(attrs ?? {})) {
        node.setAttribute(name, value);
      }
      return node;
    },

    /**
     * Point an image at the brand placeholder if its file is missing, so a
     * gap in the photography shows a styled tile rather than a broken icon.
     *
     * @param {HTMLImageElement} image
     */
    fallbackImage(image) {
      image.addEventListener(
        "error",
        () => {
          image.src = "images/placeholder-product.svg";
        },
        { once: true }, // once, so a missing placeholder cannot loop
      );
    },

    /**
     * Run a callback once the DOM is ready, whether or not DOMContentLoaded
     * has already fired.
     *
     * @param {() => void} callback
     */
    ready(callback) {
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", callback);
      } else {
        callback();
      }
    },
  };
})();
