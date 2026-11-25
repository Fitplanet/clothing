/* Shared product helpers. Used by the website. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.Catalog = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var CATS = {
    shirts: { label: "Shirts", page: "shirts.html", styles: ["tee", "long"] },
    pants: { label: "Baggy Pants", page: "baggy-pants.html", styles: ["baggy", "cargo"] },
    shoes: { label: "Shoes", page: "shoes.html", styles: ["low", "high"] }
  };

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function fmt(n, cur) {
    n = Math.round(Number(n) || 0);
    return (cur || "Rs") + " " + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function safeHex(h) { return /^#[0-9a-f]{6}$/i.test(h || "") ? h : "#888888"; }

  // Only allow normal http(s) links or plain relative paths (blocks javascript: etc.)
  function safeUrl(u) {
    u = String(u || "").trim();
    if (!u) return "";
    if (u.indexOf(":") !== -1) return /^https?:\/\//i.test(u) ? u : "";
    return /^[\w\-./%~]+$/.test(u) ? u : "";
  }

  function shade(hex, a) {
    var n = parseInt(safeHex(hex).slice(1), 16);
    var r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    var t = a < 0 ? 0 : 255, p = Math.abs(a);
    r = Math.round((t - r) * p + r); g = Math.round((t - g) * p + g); b = Math.round((t - b) * p + b);
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  function lum(hex) {
    var n = parseInt(safeHex(hex).slice(1), 16);
    return (0.2126 * (n >> 16) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
  }

  function tintFor(hex) { return lum(hex) > 0.72 ? "#d8cfbd" : shade(hex, 0.86); }

  /* ---------- Illustrations (used when a product has no photo) ---------- */
  function artSVG(cat, style, hex) {
    hex = safeHex(hex);
    var edge = shade(hex, -0.32), dark = shade(hex, -0.2);
    var ink = lum(hex) > 0.55 ? "#14110f" : "#ffffff";
    var body = "";

    if (cat === "shirts") {
      if (style === "long") {
        body =
          '<path d="M82 28 L46 40 L22 108 L12 164 L34 170 L50 118 L54 172 L146 172 L150 118 L166 170 L188 164 L178 108 L154 40 L118 28 Q100 48 82 28Z" fill="' + hex + '" stroke="' + edge + '" stroke-width="2" stroke-linejoin="round"/>' +
          '<path d="M100 46 L118 28 L154 40 L178 108 L188 164 L166 170 L150 118 L146 172 L100 172Z" fill="rgba(0,0,0,.07)"/>' +
          '<path d="M12 164 L34 170 M188 164 L166 170" stroke="' + edge + '" stroke-width="5" stroke-linecap="round"/>' +
          '<path d="M54 160 H146" stroke="' + edge + '" stroke-width="4" opacity=".5"/>';
      } else {
        body =
          '<path d="M82 28 L46 40 L18 78 L38 92 L54 80 L54 172 L146 172 L146 80 L162 92 L182 78 L154 40 L118 28 Q100 48 82 28Z" fill="' + hex + '" stroke="' + edge + '" stroke-width="2" stroke-linejoin="round"/>' +
          '<path d="M100 46 L118 28 L154 40 L182 78 L162 92 L146 80 L146 172 L100 172Z" fill="rgba(0,0,0,.07)"/>' +
          '<rect x="118" y="62" width="17" height="7" rx="2" fill="' + ink + '" opacity=".7"/>' +
          '<path d="M70 150 Q80 122 74 98" stroke="rgba(0,0,0,.1)" stroke-width="3" fill="none" stroke-linecap="round"/>';
      }
      body += '<path d="M82 28 Q100 48 118 28" fill="none" stroke="' + edge + '" stroke-width="5" stroke-linecap="round"/>';
    } else if (cat === "pants") {
      if (style === "cargo") {
        body =
          '<path d="M58 18 H142 L150 168 H112 L100 82 L88 168 H50 Z" fill="' + hex + '" stroke="' + edge + '" stroke-width="2" stroke-linejoin="round"/>' +
          '<path d="M100 82 L112 168 H150 L142 18 H100Z" fill="rgba(0,0,0,.07)"/>' +
          '<rect x="54" y="92" width="26" height="32" rx="3" fill="' + dark + '" stroke="' + edge + '" stroke-width="1.5"/>' +
          '<rect x="120" y="92" width="26" height="32" rx="3" fill="' + dark + '" stroke="' + edge + '" stroke-width="1.5"/>' +
          '<rect x="50" y="162" width="38" height="12" rx="3" fill="' + edge + '"/><rect x="112" y="162" width="38" height="12" rx="3" fill="' + edge + '"/>';
      } else {
        body =
          '<path d="M58 18 H142 L152 176 H108 L100 82 L92 176 H48 Z" fill="' + hex + '" stroke="' + edge + '" stroke-width="2" stroke-linejoin="round"/>' +
          '<path d="M100 82 L108 176 H152 L142 18 H100Z" fill="rgba(0,0,0,.07)"/>' +
          '<path d="M49 160 H93 M107 160 H151" stroke="rgba(0,0,0,.18)" stroke-width="3" stroke-linecap="round"/>' +
          '<path d="M62 42 Q72 48 74 70 M138 42 Q128 48 126 70" stroke="' + edge + '" stroke-width="2" fill="none" stroke-linecap="round"/>';
      }
      body +=
        '<path d="M58 18 H142 L143 32 H57Z" fill="' + dark + '" stroke="' + edge + '" stroke-width="2" stroke-linejoin="round"/>' +
        '<path d="M100 32 V82" stroke="' + edge + '" stroke-width="2"/>' +
        '<circle cx="100" cy="25" r="2.5" fill="' + ink + '" opacity=".7"/>';
    } else {
      var sole = lum(hex) > 0.72 ? "#d6cdbb" : "#f6f1e6";
      var upper = style === "high"
        ? "M26 138 V70 Q26 58 38 56 L70 52 Q80 50 84 62 L90 78 Q100 84 116 86 Q128 88 146 92 Q184 100 186 124 V138Z"
        : "M26 138 V116 Q26 106 36 104 L60 98 Q70 94 76 82 L84 66 Q90 58 100 62 L116 76 Q128 86 146 92 Q184 100 186 124 V138Z";
      body =
        '<ellipse cx="106" cy="168" rx="86" ry="6" fill="rgba(0,0,0,.13)"/>' +
        '<path d="' + upper + '" fill="' + hex + '" stroke="' + edge + '" stroke-width="2" stroke-linejoin="round"/>' +
        '<path d="M26 138 V' + (style === "high" ? 70 : 116) + ' Q26 ' + (style === "high" ? 58 : 106) + ' 38 ' + (style === "high" ? 56 : 104) + ' L46 ' + (style === "high" ? 55 : 102) + ' V138Z" fill="' + dark + '"/>' +
        '<path d="M150 92 Q178 104 182 138" fill="none" stroke="' + edge + '" stroke-width="2.5"/>' +
        '<path d="M52 128 Q98 108 148 124" fill="none" stroke="' + ink + '" stroke-width="5" stroke-linecap="round" opacity=".55"/>' +
        (style === "high"
          ? '<path d="M30 66 Q56 60 82 66" fill="none" stroke="' + edge + '" stroke-width="2.5"/><path d="M62 72 L78 66 M66 84 L84 76 M74 94 L94 84 M86 100 L106 90" stroke="' + ink + '" stroke-width="3" stroke-linecap="round" opacity=".75"/>'
          : '<path d="M92 78 L108 70 M100 88 L116 80 M110 94 L126 86" stroke="' + ink + '" stroke-width="3" stroke-linecap="round" opacity=".75"/>') +
        '<path d="M20 138 H184 Q190 138 190 146 V152 Q190 158 184 158 H26 Q20 158 20 152Z" fill="' + sole + '" stroke="' + shade(sole, -0.25) + '" stroke-width="2"/>' +
        '<path d="M30 150 H180" stroke="rgba(0,0,0,.12)" stroke-width="2" stroke-dasharray="6 6"/>';
      body = '<g transform="translate(0,-8)">' + body + "</g>";
    }
    return '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">' + body + "</svg>";
  }

  /* ---------- Helpers ---------- */
  function defaultSize(p) {
    var s = p.sizes || [];
    return s.indexOf("M") !== -1 ? "M" : (s[Math.floor((s.length - 1) / 2)] || s[0] || "");
  }

  function waLink(store, p, colorName, size) {
    var num = String((store && store.whatsapp) || "").replace(/\D/g, "");
    if (!num) return "#";
    var text = "Hi " + ((store && store.name) || "") + "! I'd like to order: " + p.name +
      " (" + colorName + ", size " + size + ") - " + fmt(p.price, store && store.currency);
    return "https://wa.me/" + num + "?text=" + encodeURIComponent(text);
  }

  function artFor(p, color) {
    var img = safeUrl(color && color.image) || safeUrl(p.image);
    if (img) return '<img src="' + esc(img) + '" alt="' + esc(p.name + (color ? " in " + color.name : "")) + '" loading="lazy" decoding="async" width="400" height="400">';
    return artSVG(p.category, p.style, color && color.hex);
  }

  function cardHTML(p, store, idx) {
    var colors = (p.colors && p.colors.length) ? p.colors : [{ name: "Default", hex: "#888888" }];
    var c0 = colors[0], size = defaultSize(p), cur = store && store.currency;
    var sold = p.inStock === false;
    var badge = sold ? "Sold out" : (p.badge || "");
    var price = '<strong>' + esc(fmt(p.price, cur)) + '</strong>' +
      (Number(p.oldPrice) > Number(p.price) ? ' <s aria-label="Old price">' + esc(fmt(p.oldPrice, cur)) + "</s>" : "");

    var sw = colors.map(function (c, i) {
      return '<button type="button" class="sw' + (i === 0 ? " is-on" : "") + '" data-i="' + i + '" style="--c:' + esc(safeHex(c.hex)) +
        '" aria-label="' + esc(c.name) + '" aria-pressed="' + (i === 0 ? "true" : "false") + '"></button>';
    }).join("");

    var sizes = (p.sizes || []).map(function (s) {
      return '<button type="button" class="size' + (s === size ? " is-on" : "") + '" data-size="' + esc(s) + '" aria-pressed="' + (s === size ? "true" : "false") + '">' + esc(s) + "</button>";
    }).join("");

    var cta = sold
      ? '<span class="btn btn-wa is-off" aria-disabled="true">Sold out</span>'
      : '<a class="btn btn-wa" data-wa href="' + esc(waLink(store, p, c0.name, size)) + '" target="_blank" rel="noopener">Order on WhatsApp</a>';

    return '<article class="pcard' + (sold ? " is-sold" : "") + '" data-id="' + esc(p.id) + '" style="--i:' + (idx || 0) + '">' +
      '<div class="pimg" style="--tint:' + esc(tintFor(c0.hex)) + '">' +
      (badge ? '<span class="pbadge">' + esc(badge) + "</span>" : "") +
      '<div class="art" data-art>' + artFor(p, c0) + "</div></div>" +
      '<div class="pbody"><h3>' + esc(p.name) + "</h3>" +
      '<p class="pdesc">' + esc(p.description) + "</p>" +
      '<p class="price">' + price + "</p>" +
      '<div class="opt"><span class="opt-l">Colour: <b data-colorname>' + esc(c0.name) + '</b></span>' +
      '<div class="swatches" role="group" aria-label="Colour">' + sw + "</div></div>" +
      '<div class="opt"><span class="opt-l">Size</span><div class="sizes" role="group" aria-label="Size">' + sizes + "</div></div>" +
      cta + "</div></article>";
  }

  function sortProducts(list, mode) {
    var a = list.slice();
    if (mode === "price-asc") a.sort(function (x, y) { return x.price - y.price; });
    if (mode === "price-desc") a.sort(function (x, y) { return y.price - x.price; });
    return a;
  }

  function absUrl(site, u) {
    u = safeUrl(u);
    if (!u) return "";
    return /^https?:\/\//i.test(u) ? u : site.replace(/\/$/, "") + "/" + u.replace(/^\.?\//, "");
  }

  function ldItemList(list, store, site, name) {
    return {
      "@context": "https://schema.org", "@type": "ItemList", "name": name,
      "itemListElement": list.map(function (p, i) {
        var prod = {
          "@type": "Product", "name": p.name, "description": p.description,
          "offers": {
            "@type": "Offer", "price": String(p.price), "priceCurrency": "PKR",
            "availability": p.inStock === false ? "https://schema.org/OutOfStock" : "https://schema.org/InStock"
          }
        };
        var im = absUrl(site, p.image);
        if (im) prod.image = im;
        return { "@type": "ListItem", "position": i + 1, "item": prod };
      })
    };
  }

  function byCat(products, cat) {
    return products.filter(function (p) { return p.category === cat; });
  }

  return {
    CATS: CATS, esc: esc, fmt: fmt, safeHex: safeHex, safeUrl: safeUrl, shade: shade, lum: lum, tintFor: tintFor,
    artSVG: artSVG, artFor: artFor, cardHTML: cardHTML, waLink: waLink, defaultSize: defaultSize,
    sortProducts: sortProducts, ldItemList: ldItemList, byCat: byCat
  };
});
