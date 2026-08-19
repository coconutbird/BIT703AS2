# Aotearoa Adventure Gear

A static front end for a New Zealand outdoor equipment store frontend for BIT703AS2.

## Opening it

Download or clone the repository and open `AS2/index.html` in a browser
straight from disk.

There is nothing to install, no build step and no web server. Every page works
from a `file://` URL, which the assessment requires, so the site uses classic
scripts rather than modules and holds its product data in a `.js` file rather
than fetching JSON.

## Pages

| File                | Page                                                              |
| ------------------- | ----------------------------------------------------------------- |
| `AS2/index.html`    | Home, with the featured products carousel and the floating anchor |
| `AS2/shop.html`     | Shop, with search and the category tiles                          |
| `AS2/product.html`  | Product detail, with reviews                                      |
| `AS2/cart.html`     | Shopping cart                                                     |
| `AS2/shipping.html` | Shipping details, including the free shipping offer               |
| `AS2/payment.html`  | Payment options                                                   |

The cart is shared across all six pages and survives a reload.

## Layout

| Folder            | Holds                                                                                                        |
| ----------------- | ------------------------------------------------------------------------------------------------------------ |
| `AS2/css/`        | the custom stylesheets, each named for what it holds, and vendored CSS in `css/third_party/`                 |
| `AS2/js/`         | site scripts split into `services/`, `components/` and `pages/`, and vendored libraries in `js/third_party/` |
| `AS2/fonts/`      | self hosted Montserrat, Open Sans and the Bootstrap Icons font                                               |
| `AS2/images/`     | the logo, the favicon and the product placeholder                                                            |
| `AS2/wireframes/` | the six supplied wireframes                                                                                  |

Stylesheets are named for their purpose rather than numbered: `custom-nav.css`
holds the masthead, navigation and footer, `custom-forms.css` holds the controls
and their validation states, `custom-checkout.css` holds the cart, summary and
payment blocks, and so on.

## Built with

| Component             | Version      | Used for                                                                                     |
| --------------------- | ------------ | -------------------------------------------------------------------------------------------- |
| Bootstrap             | 5.3.3        | grid, carousel, collapse, tooltip and the form validation classes                            |
| Alpine.js             | 3.14.8       | rendering the repeated lists, with the `data-x-` prefix so every directive stays valid HTML5 |
| Bootstrap Icons       | 1.11.3       | cart, search, stars and chevrons                                                             |
| Montserrat, Open Sans | latin subset | headings and body text                                                                       |

Form validation is native JavaScript built on the browser's Constraint
Validation API.

Every library is vendored locally rather than loaded from a CDN, so the site
works offline. Each library ships its licence text beside it to not get sued and
`AS2/THIRD-PARTY-NOTICES.md` lists component, version, licence and where each
licence text lives.
