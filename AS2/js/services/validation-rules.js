/**
 * @file The custom validation rules (Task 3a).
 *
 * These EXTEND native validation rather than replace it: every field keeps its
 * HTML5 attributes, and these add what HTML5 cannot express - algorithmic
 * checks (Luhn, expiry arithmetic), cross-field rules (CVV length depends on
 * the card brand) and NZ formats. A field opts in with data-rule="name".
 *
 * Client-side only; a store with a server behind it would repeat every rule there.
 */

/**
 * A validation rule.
 *
 * @callback ValidationRule
 * @param {string} value the field's current value, already known to be non-empty
 * @param {HTMLInputElement|HTMLSelectElement} field
 * @returns {string|null} an error message, or null when the value is valid
 */

(() => {
  "use strict";

  Store.validate ??= {};

  /**
   * Empty values are ignored here - required is HTML5's job, and checking it
   * twice would show two messages for one empty field.
   *
   * @type {Record<string, ValidationRule>}
   */
  const rules = {
    /**
     * `type="email"` only requires `something@something`. It accepts `a@b`,
     * which has no dot and no top-level domain, and it accepts a trailing dot.
     * This is a deliberate tightening of that rule, not the spec's own pattern,
     * and it does not attempt RFC 5322 - the only way to truly verify an
     * address is to send mail to it. The 254-character cap is the maximum
     * length of a reverse-path in RFC 5321.
     *
     * @see https://html.spec.whatwg.org/multipage/input.html#valid-e-mail-address
     * @see https://datatracker.ietf.org/doc/html/rfc5321#section-4.5.3.1
     */
    email(value) {
      if (!/^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(value)) {
        return "Enter a valid email address, for example name@example.co.nz";
      }
      if (/\.{2,}/.test(value) || value.length > 254) {
        return "That email address does not look right.";
      }
      return null;
    },

    /**
     * NZ postcodes are exactly four digits. `pattern="\d{4}"` gets close, but
     * a pattern mismatch produces a generic browser message; this one names
     * the expected format.
     *
     * @see https://www.nzpost.co.nz/tools/address-postcode-finder
     */
    nzPostcode: (value) =>
      /^\d{4}$/.test(value.trim())
        ? null
        : "Enter a 4-digit New Zealand postcode, for example 8023.",

    /**
     * `type="tel"` performs NO validation - it exists only to bring up a
     * numeric keypad. Separators are stripped first, because people type phone
     * numbers however they like.
     */
    nzPhone(value) {
      let digits = value.replace(/[\s()-]/g, "");
      if (digits.startsWith("+64")) digits = `0${digits.slice(3)}`;

      return /^0\d{8,9}$/.test(digits)
        ? null
        : "Enter a NZ phone number, for example 021 555 1234 or 03 555 1234.";
    },

    /**
     * `min` and `step` are enforced by the browser, but a pasted `"1e3"`
     * parses as 1000 and `"2.5"` satisfies `min="1"`. Stock is read from
     * `data-max-stock` so the message can name the real limit.
     */
    quantity(value, field) {
      if (!/^\d+$/.test(value.trim())) return "Enter a whole number of items.";

      const qty = Number.parseInt(value, 10);
      if (qty < 1) return "Quantity must be at least 1.";

      const stock = Number.parseInt(field.getAttribute("data-max-stock"), 10);
      if (Number.isFinite(stock) && qty > stock) return `Only ${stock} left in stock.`;

      return null;
    },

    /**
     * People's names are not `\w+`. Macrons, accents, hyphens and apostrophes
     * are all legitimate (Ngā, O'Brien, Anne-Marie); digits are not. `\p{L}`
     * is a Unicode property escape, so it matches letters in any script.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Regular_expressions/Unicode_character_class_escape
     */
    personName(value) {
      const trimmed = value.trim();
      if (trimmed.length < 2) return "Enter at least 2 characters.";
      if (!/^[\p{L}][\p{L}\s'.-]*$/u.test(trimmed)) {
        return "Use letters, spaces, hyphens and apostrophes only.";
      }
      return null;
    },

    cardHolder(value, field) {
      const nameError = rules.personName(value, field);
      if (nameError) return nameError;

      return value.trim().split(/\s+/).length < 2
        ? "Enter the full name printed on the card."
        : null;
    },

    /**
     * Luhn checksum - the clearest thing HTML5 cannot do. A pattern can
     * confirm 16 digits; it cannot confirm they form a valid card number.
     *
     * Right to left, every second digit is doubled and any result above 9 has
     * 9 subtracted; a valid number's total divides by 10. It catches typos,
     * not whether the card exists.
     *
     * @see ISO/IEC 7812-1:2017, Annex B - check digit formula (Luhn)
     */
    cardNumber(value) {
      const digits = value.replace(/[\s-]/g, "");
      if (!/^\d{13,19}$/.test(digits)) {
        return "Enter the 13 to 19 digit number from the front of the card.";
      }

      let sum = 0;
      let double = false;

      for (let i = digits.length - 1; i >= 0; i -= 1) {
        let digit = Number(digits[i]);
        if (double) {
          digit *= 2;
          if (digit > 9) digit -= 9;
        }
        sum += digit;
        double = !double;
      }

      return sum % 10 === 0 ? null : "That card number is not valid - please check for a typo.";
    },

    /**
     * Comparing MM/YY against today is date arithmetic, which no HTML
     * attribute can do. The cutoff is day 1 of the FOLLOWING month, because a
     * card stays valid through the whole of its expiry month.
     */
    cardExpiry(value) {
      const match = /^(0[1-9]|1[0-2])\s*\/\s*(\d{2})$/.exec(value.trim());
      if (!match) return "Enter the expiry as MM/YY, for example 07/28.";

      const month = Number(match[1]);
      const year = 2000 + Number(match[2]);
      const now = new Date();

      if (new Date(year, month, 1) <= now) return "That card has expired.";
      if (year > now.getFullYear() + 15) return "Check the expiry year.";

      return null;
    },

    /**
     * CROSS-FIELD RULE: American Express uses a 4-digit security code, every
     * other brand uses 3. The correct length depends on a different input's
     * value, which `maxlength` cannot express. The brand is read from the
     * issuer identification number at the start of the card number.
     *
     * @see ISO/IEC 7812-1:2017 - issuer identification numbers
     */
    cardCvv(value, field) {
      const numberField = field.form?.querySelector("[data-rule~='cardNumber']");
      const isAmex = /^3[47]/.test(numberField?.value.replace(/[\s-]/g, "") ?? "");
      const expected = isAmex ? 4 : 3;

      if (new RegExp(`^\\d{${expected}}$`).test(value.trim())) return null;

      return isAmex
        ? "American Express security codes are 4 digits."
        : "Enter the 3-digit security code from the back of the card.";
    },

    /** Format only - whether the code EXISTS is the cart module's decision. */
    couponFormat: (value) =>
      /^[A-Za-z0-9]{4,12}$/.test(value.trim())
        ? null
        : "Coupon codes are 4 to 12 letters and numbers.",

    /**
     * Free text that ends up on screen. This is a usability guard and defence
     * in depth only - the real protection is that every value is rendered with
     * textContent, never innerHTML (see Store.dom.setText).
     */
    safeText: (value) => (/[<>]/.test(value) ? "Please remove the < and > characters." : null),
  };

  Store.validate.rules = rules;
})();
