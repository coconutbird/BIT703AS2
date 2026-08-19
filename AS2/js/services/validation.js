/**
 * @file The validation engine (Task 3a).
 *
 * Built on the Constraint Validation API - checkValidity(), the validity
 * object, setCustomValidity() - which needs no library. jQuery Validate would
 * add ~90KB to do what querySelector and checkValidity() already do, and every
 * custom rule would still be hand-written.
 *
 * A form opts in with data-validate="name".
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Constraint_validation
 */

(() => {
  "use strict";

  const { $$, setText, el, ready } = Store.dom;

  Store.validate ??= {};

  /**
   * Work out the message for one field: native constraints first, then the
   * custom rules named in `data-rule`.
   *
   * @param {HTMLInputElement|HTMLSelectElement} field
   * @returns {string|null}
   */
  const messageFor = (field) => {
    const value = String(field.value ?? "");

    // Clear any message left from a previous run, or the field stays invalid.
    field.setCustomValidity("");

    const nativelyValid = field.checkValidity();

    // An empty required field is the one case the page-authored message is
    // for. It must NOT be reused for a pattern or type failure - "Enter your
    // postcode" is useless when the problem is that 802 is three digits.
    if (field.validity.valueMissing) {
      return field.getAttribute("data-error-required") ?? "This field is required.";
    }

    // An empty optional field has nothing left to check.
    if (value.trim() === "") return null;

    // Custom rules run next, because they produce a specific message where the
    // browser would only say "match the requested format".
    for (const name of (field.getAttribute("data-rule") ?? "")
      .trim()
      .split(/\s+/)
      .filter(Boolean)) {
      const error = Store.validate.rules[name]?.(value, field);
      if (error) return error;
    }

    // A native constraint no custom rule covers - fall back to the browser's
    // wording rather than passing a value the browser has rejected.
    return nativelyValid ? null : field.validationMessage;
  };

  /**
   * Paint or clear one field's error state.
   *
   * Colour is never the only signal: aria-invalid and the message text carry
   * it too, and the message goes in the element aria-describedby names so it
   * is announced on focus.
   *
   * @param {HTMLInputElement|HTMLSelectElement} field
   * @param {string|null} message
   */
  const paint = (field, message) => {
    /* Most fields name their message element with aria-describedby. Rows that
       Alpine repeats have no stable id to point at, so they place the message
       next to the input instead and it is found by position. */
    const errorNode =
      document.getElementById(field.getAttribute("aria-describedby") ?? "") ??
      field.parentElement?.querySelector(".invalid-feedback") ??
      null;

    if (message) {
      field.classList.add("is-invalid");
      field.classList.remove("is-valid");
      field.setAttribute("aria-invalid", "true");
      setText(errorNode, message);
      return;
    }

    field.classList.remove("is-invalid");
    field.removeAttribute("aria-invalid");
    setText(errorNode, "");
    field.classList.toggle("is-valid", field.value.trim() !== "");
  };

  /**
   * An error summary at the top of the form, linking to each bad field. On a
   * long form this is what stops a user hunting for which of fourteen inputs
   * is wrong; `role="alert"` makes it announce itself as soon as it appears.
   *
   * @param {HTMLFormElement} form
   * @param {Array<{field: HTMLElement, message: string}>} errors
   */
  const renderSummary = (form, errors) => {
    const summary = form.querySelector("[data-error-summary]");
    if (!summary) return;

    const heading = el("p", {
      class: "gear-error-summary__title",
      text:
        errors.length === 1
          ? "There is 1 problem with this form:"
          : `There are ${errors.length} problems with this form:`,
    });

    const list = el("ul");
    for (const { field, message } of errors) {
      const link = el("a", { text: message, attrs: { href: `#${field.id}` } });
      link.addEventListener("click", (event) => {
        event.preventDefault();
        field.focus();
      });

      const item = el("li");
      item.append(link);
      list.append(item);
    }

    summary.replaceChildren(heading, list);
    summary.hidden = false;
  };

  /** @param {HTMLFormElement} form */
  const clearSummary = (form) => {
    const summary = form.querySelector("[data-error-summary]");
    if (!summary) return;
    summary.replaceChildren();
    summary.hidden = true;
  };

  /**
   * Wire one form.
   *
   * Validate on blur, then on input only once a field is already invalid, so
   * errors clear as they are fixed rather than firing mid-typing.
   *
   * @param {HTMLFormElement} form
   */
  const initForm = (form) => {
    /* Progressive enhancement: the markup keeps native validation, so a form
       still validates if this script never loads. Turning it off here hands
       the job to the rules below only once they are actually available. */
    form.noValidate = true;

    const fields = /** @type {Array<HTMLInputElement|HTMLSelectElement>} */ (
      $$("input, select, textarea", form)
    ).filter((field) => !["submit", "button"].includes(field.type));

    for (const field of fields) {
      field.addEventListener("blur", () => paint(field, messageFor(field)));
      field.addEventListener("input", () => {
        if (field.classList.contains("is-invalid")) paint(field, messageFor(field));
      });
    }

    form.addEventListener("submit", (event) => {
      const errors = [];

      for (const field of fields) {
        if (field.disabled) continue; // e.g. card fields while PayPal is chosen

        const message = messageFor(field);
        paint(field, message);
        if (message) errors.push({ field, message });
      }

      if (errors.length) {
        event.preventDefault();
        renderSummary(form, errors);

        // The most useful thing this module does for keyboard and screen
        // reader users: without it, submitting a long form reports failure
        // with no indication of where the problem is.
        errors[0].field.focus();
        return;
      }

      clearSummary(form);
      Store.bus.emit("form:valid", { form });

      // A form with an action goes where it says - the header search really
      // does navigate to shop.html.
      if (form.getAttribute("action")) return;

      const next = form.getAttribute("data-next-page");
      if (form.getAttribute("data-on-valid") === "navigate" && next) {
        event.preventDefault();
        window.location.href = next;
        return;
      }

      // No server exists here, so an otherwise-valid submit is
      // reported in place. A real implementation would hook in here.
      event.preventDefault();
      const status = form.querySelector("[data-form-status]");
      if (status) {
        setText(
          status,
          form.getAttribute("data-success-message") ?? "Thanks - that all looks correct.",
        );
        status.classList.add("is-success");
      }
    });
  };

  Store.validate.check = messageFor;

  Store.validate.paint = paint;

  ready(() => {
    for (const form of $$("form[data-validate]")) initForm(form);
  });
})();
