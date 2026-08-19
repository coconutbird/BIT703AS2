/**
 * @file Product catalogue and the read API every other module goes through.
 *
 * A .js file rather than JSON because fetch() and XMLHttpRequest are both
 * blocked on a file:// page. A plain script tag is parsed, not fetched.
 * Prices are integer cents.
 */

/**
 * @typedef {object} Product
 * @property {string}   id
 * @property {string}   name
 * @property {string}   category
 * @property {number}   price        integer cents
 * @property {number}   rating       0-5, halves allowed
 * @property {number}   reviewCount
 * @property {number}   stock
 * @property {string}   image        path relative to the page
 * @property {string}   blurb        one line, used on cards
 * @property {string}   description  full copy, used on the detail page
 * @property {string[]} models
 * @property {boolean}  featured     appears in the home-page carousel
 */

/**
 * @typedef {object} Category
 * @property {string} id
 * @property {string} name
 * @property {string} image
 */

/**
 * @typedef {object} Review
 * @property {string} productId
 * @property {string} author
 * @property {string} date    ISO 8601
 * @property {number} rating
 * @property {string} body
 */

(() => {
  "use strict";

  /**
   * No product photography was supplied with the brief and none is shipped, so
   * every product and category points at the brand placeholder tile. Pointing
   * at photographs that are not in the folder would leave a broken request on
   * every page; the placeholder is the honest state of the catalogue.
   */
  const PLACEHOLDER = "images/placeholder-product.svg";

  /** @type {Product[]} */
  const PRODUCTS = [
    {
      id: "gear-alpine-pack-65",
      name: "Alpine Ascent Pack 65L",
      category: "Packs",
      price: 42_900,
      rating: 4.5,
      reviewCount: 38,
      stock: 12,
      image: PLACEHOLDER,
      blurb: "Load-hauling alpine pack with an adjustable harness and hydration sleeve.",
      description:
        "Built for multi-day traverses in the Southern Alps. A floating lid, removable " +
        "bivy pad and reinforced crampon patch keep the load stable and the fabric " +
        "intact when the route turns technical.",
      models: ["Regular torso", "Long torso", "Women's fit"],
      featured: true,
    },
    {
      id: "gear-tussock-tent-2",
      name: "Tussock 2 Four-Season Tent",
      category: "Shelter",
      price: 89_900,
      rating: 5,
      reviewCount: 21,
      stock: 6,
      image: PLACEHOLDER,
      blurb: "Two-person geodesic tent rated for sustained alpine wind.",
      description:
        "A five-pole geodesic frame that stays rigid in a gale, with a 3000mm " +
        "hydrostatic-head fly and taped seams throughout. Pitches fly-first so the " +
        "inner stays dry in Westland rain.",
      models: ["Standard", "With footprint"],
      featured: true,
    },
    {
      id: "gear-kea-down-jacket",
      name: "Kea Down Jacket 700FP",
      category: "Apparel",
      price: 54_900,
      rating: 4.5,
      reviewCount: 64,
      stock: 24,
      image: PLACEHOLDER,
      blurb: "Responsibly sourced 700 fill-power down with a recycled ripstop shell.",
      description:
        "Box-wall construction eliminates cold spots through the body, and the shell " +
        "carries a PFC-free water-repellent finish. Packs into its own chest pocket.",
      models: ["XS", "S", "M", "L", "XL"],
      featured: true,
    },
    {
      id: "gear-southern-boot",
      name: "Southern Cross Tramping Boot",
      category: "Footwear",
      price: 47_900,
      rating: 4,
      reviewCount: 52,
      stock: 18,
      image: PLACEHOLDER,
      blurb: "Full-grain leather boot with a crampon-compatible shank.",
      description:
        "A stiffened nylon shank supports heavy loads on rough ground while the Vibram " +
        "outsole grips wet rock and river stones.",
      models: ["UK 7", "UK 8", "UK 9", "UK 10", "UK 11", "UK 12"],
      featured: false,
    },
    {
      id: "gear-headlamp-450",
      name: "Nightfall 450 Headlamp",
      category: "Lighting",
      price: 12_900,
      rating: 4,
      reviewCount: 87,
      stock: 40,
      image: PLACEHOLDER,
      blurb: "450-lumen rechargeable headlamp with a reactive beam sensor.",
      description:
        "USB-C rechargeable with a 60-hour reserve mode and a red night setting that " +
        "preserves dark adaptation in a hut full of sleeping trampers.",
      models: ["Standard", "With spare battery"],
      featured: false,
    },
    {
      id: "gear-merino-baselayer",
      name: "Kaikoura Merino Base Layer",
      category: "Apparel",
      price: 18_900,
      rating: 4.5,
      reviewCount: 113,
      stock: 55,
      image: PLACEHOLDER,
      blurb: "200gsm New Zealand merino with flatlock seams.",
      description:
        "Grown in the South Island high country and knitted to 200gsm - warm enough for " +
        "shoulder-season tramping and light enough to wear all day.",
      models: ["XS", "S", "M", "L", "XL"],
      featured: false,
    },
    {
      id: "gear-billy-stove",
      name: "Billy Ultralight Stove System",
      category: "Cooking",
      price: 22_900,
      rating: 4,
      reviewCount: 45,
      stock: 30,
      image: PLACEHOLDER,
      blurb: "Integrated 800ml pot and burner that boils in under three minutes.",
      description:
        "A heat-exchanger pot cuts fuel use by roughly a third against a bare canister " +
        "burner, and the system nests inside the pot with a 100g canister.",
      models: ["800ml", "1.3L"],
      featured: false,
    },
    {
      id: "gear-plb-locator",
      name: "Rescue Personal Locator Beacon",
      category: "Safety",
      price: 63_900,
      rating: 5,
      reviewCount: 29,
      stock: 9,
      image: PLACEHOLDER,
      blurb: "406MHz beacon registered with the NZ Rescue Coordination Centre.",
      description:
        "Seven-year battery, floats, and transmits on 406MHz with a 121.5MHz homing " +
        "signal. Registration with RCCNZ is free and takes ten minutes.",
      models: ["Standard"],
      featured: false,
    },
  ];

  /** @type {Category[]} */
  const CATEGORIES = [
    { id: "packs", name: "Packs", image: PLACEHOLDER },
    { id: "shelter", name: "Shelter", image: PLACEHOLDER },
    { id: "apparel", name: "Apparel", image: PLACEHOLDER },
  ];

  /** @type {Review[]} */
  const REVIEWS = [
    {
      productId: "gear-alpine-pack-65",
      author: "Mere Tainui",
      date: "2025-03-14",
      rating: 5,
      body:
        "Carried 22kg over the Copland Pass and the harness never shifted. The floating " +
        "lid swallows a rope without unbalancing the load.",
    },
    {
      productId: "gear-alpine-pack-65",
      author: "Sam Whitcombe",
      date: "2025-02-02",
      rating: 4,
      body:
        "Excellent pack, though the hip-belt pockets are too small for a decent camera. " +
        "Fabric has shrugged off three weeks of scrub-bashing.",
    },
  ];

  /**
   * @memberof Store
   * @namespace Store.catalogue
   */
  Store.catalogue = {
    /** @returns {Product[]} a copy, so callers cannot mutate the catalogue */
    all: () => [...PRODUCTS],

    /**
     * @param {string} id
     * @returns {Product|null}
     */
    byId: (id) => PRODUCTS.find((product) => product.id === id) ?? null,

    /** @returns {Product[]} */
    featured: () => PRODUCTS.filter((product) => product.featured),

    /** @returns {Category[]} */
    categories: () => [...CATEGORIES],

    /**
     * @param {string} productId
     * @returns {Review[]}
     */
    reviewsFor: (productId) => REVIEWS.filter((review) => review.productId === productId),

    /**
     * Case-insensitive search across name, category and blurb.
     *
     * @param {string} term empty returns everything
     * @returns {Product[]}
     */
    search(term) {
      const needle = String(term ?? "")
        .trim()
        .toLowerCase();
      if (!needle) return [...PRODUCTS];

      return PRODUCTS.filter(({ name, category, blurb }) =>
        `${name} ${category} ${blurb}`.toLowerCase().includes(needle),
      );
    },
  };
})();
