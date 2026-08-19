/**
 * @file The floating anchor (Task 2a) - home page only.
 *
 * IntersectionObserver, not a scroll listener: it fires when a threshold is
 * crossed rather than on every frame.
 */

(() => {
  "use strict";

  const { $, $$, ready } = Store.dom;

  const initAnchor = () => {
    const anchor = $("[data-anchor]");
    if (!anchor) return;

    const sentinel = $("[data-anchor-sentinel]");
    const links = /** @type {HTMLAnchorElement[]} */ ($$("a[href^='#']", anchor));
    const supported = typeof IntersectionObserver === "function";

    /* No IntersectionObserver falls back to always visible, the safe failure. */
    if (sentinel && supported) {
      new IntersectionObserver(
        ([entry]) => anchor.classList.toggle("is-visible", !entry.isIntersecting),
        { threshold: 0 },
      ).observe(sentinel);
    } else {
      anchor.classList.add("is-visible");
    }

    /* Negative rootMargin moves detection to the middle of the viewport.
       https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver/rootMargin */
    const targets = links
      .map((link) => document.querySelector(link.getAttribute("href")))
      .filter(Boolean);

    if (targets.length && supported) {
      const spy = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            for (const link of links) {
              link.classList.toggle(
                "is-current",
                link.getAttribute("href") === `#${entry.target.id}`,
              );
            }
          }
        },
        { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
      );

      for (const target of targets) spy.observe(target);
    }

    /* tabindex="-1" makes a section focusable but not tabbable.
       https://html.spec.whatwg.org/multipage/interaction.html#the-tabindex-attribute */
    for (const link of links) {
      link.addEventListener("click", (event) => {
        const target = document.querySelector(link.getAttribute("href"));
        if (!target) return;

        event.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
      });
    }

    const toggle = $("[data-anchor-toggle]", anchor);
    const menu = $("[data-anchor-menu]", anchor);
    if (!toggle || !menu) return;

    /** @param {boolean} expanded */
    const setExpanded = (expanded) => {
      toggle.setAttribute("aria-expanded", String(expanded));
      menu.hidden = !expanded;
    };

    let pinned = false;

    setExpanded(false);

    toggle.addEventListener("click", () => {
      pinned = !pinned;
      setExpanded(pinned);
    });

    anchor.addEventListener("mouseenter", () => setExpanded(true));
    anchor.addEventListener("mouseleave", () => setExpanded(pinned));

    // relatedTarget is where focus is going, not where it came from.
    anchor.addEventListener("focusout", (event) => {
      if (anchor.contains(event.relatedTarget)) return;
      pinned = false;
      setExpanded(false);
    });

    anchor.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      pinned = false;
      setExpanded(false);
      toggle.focus();
    });
  };

  ready(initAnchor);
})();
