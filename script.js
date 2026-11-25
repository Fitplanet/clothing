(function () {
  "use strict";

  var C = window.Catalog;
  var doc = document, root = doc.documentElement;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var state = null;                       // { store, products }
  var view = { sort: "featured", colour: "all" };

  function $(s, c) { return (c || doc).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); }

  /* =====================  PRODUCTS  ===================== */
  function validData(d) {
    return d && d.store && Array.isArray(d.products) && d.products.every(function (p) {
      return p && p.id && p.category && C.CATS[p.category] && p.name && isFinite(Number(p.price));
    });
  }

  function loadSeed() {
    var el = $("#seed");
    if (!el) return null;
    try { var d = JSON.parse(el.textContent); return validData(d) ? d : null; } catch (e) { return null; }
  }

  function findProduct(id) {
    for (var i = 0; i < state.products.length; i++) if (state.products[i].id === id) return state.products[i];
    return null;
  }

  function listFor(grid) {
    var cat = grid.getAttribute("data-grid");
    if (cat === "featured") return state.products.filter(function (p) { return p.featured; }).slice(0, 6);
    var list = C.byCat(state.products, cat);
    if (view.colour !== "all") {
      list = list.filter(function (p) {
        return (p.colors || []).some(function (c) { return c.name.toLowerCase() === view.colour; });
      });
    }
    return C.sortProducts(list, view.sort);
  }

  function renderGrid(grid) {
    var list = listFor(grid);
    grid.innerHTML = list.length
      ? list.map(function (p, i) { return C.cardHTML(p, state.store, i); }).join("")
      : '<p class="empty">No products match this filter. Try another colour.</p>';
    var count = $("[data-count-text]");
    if (count && grid.getAttribute("data-grid") !== "featured") {
      count.textContent = list.length + (list.length === 1 ? " item" : " items");
    }
  }

  function fillColourFilter() {
    var sel = $("#colour"), grid = $("[data-grid]");
    if (!sel || !grid) return;
    var cat = grid.getAttribute("data-grid"), seen = {}, names = [];
    C.byCat(state.products, cat).forEach(function (p) {
      (p.colors || []).forEach(function (c) {
        var k = c.name.toLowerCase();
        if (!seen[k]) { seen[k] = 1; names.push(c.name); }
      });
    });
    names.sort();
    sel.innerHTML = '<option value="all">All colours</option>' +
      names.map(function (n) { return '<option value="' + C.esc(n.toLowerCase()) + '">' + C.esc(n) + "</option>"; }).join("");
    var keep = names.some(function (n) { return n.toLowerCase() === view.colour; });
    if (!keep) view.colour = "all";
    sel.value = view.colour;
  }

  function updateJsonLd(grid) {
    var cat = grid.getAttribute("data-grid"), ld = $("#ld-products");
    if (!ld || cat === "featured") return;
    var canon = $('link[rel="canonical"]');
    var site = canon ? canon.href.replace(/[^/]*$/, "") : location.origin + "/";
    ld.textContent = JSON.stringify(C.ldItemList(C.byCat(state.products, cat), state.store, site, C.CATS[cat].label));
  }

  function updateTileCounts() {
    $$("[data-tile-count]").forEach(function (el) {
      var n = C.byCat(state.products, el.getAttribute("data-tile-count")).length;
      el.textContent = n + (n === 1 ? " piece" : " pieces");
    });
  }

  function renderAll() {
    $$("[data-grid]").forEach(function (g) { renderGrid(g); updateJsonLd(g); });
    fillColourFilter();
    updateTileCounts();
  }

  /* ---------- Card interactions (colour + size) ---------- */
  function updateWa(card) {
    var a = $("[data-wa]", card);
    if (!a) return;
    var p = findProduct(card.getAttribute("data-id"));
    var on = $(".sw.is-on", card), sz = $(".size.is-on", card);
    var color = p.colors[Number(on.getAttribute("data-i"))] || p.colors[0];
    a.href = C.waLink(state.store, p, color.name, sz ? sz.getAttribute("data-size") : "");
  }

  function pick(group, btn) {
    $$("button", group).forEach(function (b) {
      var on = b === btn;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  doc.addEventListener("click", function (e) {
    var sw = e.target.closest && e.target.closest(".sw");
    var sz = e.target.closest && e.target.closest(".size");
    if (!sw && !sz) return;
    var card = (sw || sz).closest(".pcard");
    if (!card || !state) return;
    var p = findProduct(card.getAttribute("data-id"));
    if (!p) return;
    if (sw) {
      pick(sw.parentNode, sw);
      var color = p.colors[Number(sw.getAttribute("data-i"))];
      $("[data-colorname]", card).textContent = color.name;
      var art = $("[data-art]", card);
      art.innerHTML = C.artFor(p, color);
      $(".pimg", card).style.setProperty("--tint", C.tintFor(color.hex));
      if (!reduce) { art.classList.remove("pop"); void art.offsetWidth; art.classList.add("pop"); }
    } else {
      pick(sz.parentNode, sz);
    }
    updateWa(card);
  });

  /* ---------- Sort tabs + colour filter ---------- */
  function initControls() {
    var tabs = $(".tabs[data-sort]");
    if (tabs) {
      $$("button", tabs).forEach(function (b) {
        b.addEventListener("click", function () {
          view.sort = b.getAttribute("data-sort");
          $$("button", tabs).forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
          $$("[data-grid]").forEach(renderGrid);
        });
      });
    }
    var sel = $("#colour");
    if (sel) sel.addEventListener("change", function () {
      view.colour = sel.value;
      $$("[data-grid]").forEach(renderGrid);
    });
  }

  /* =====================  SIZE FINDER  ===================== */
  function initSizeFinder() {
    var form = doc.getElementById("size-form");
    if (!form) return;
    function put(id, text) {
      var el = doc.getElementById(id);
      el.textContent = text;
      if (!reduce) { el.classList.remove("pop"); void el.offsetWidth; el.classList.add("pop"); }
    }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var msg = doc.getElementById("calc-msg");
      var chest = parseFloat(doc.getElementById("chest").value);
      var waist = parseFloat(doc.getElementById("waist").value);
      var foot = parseFloat(doc.getElementById("foot").value);
      var okC = chest >= 70 && chest <= 150, okW = waist >= 55 && waist <= 150, okF = foot >= 20 && foot <= 34;

      if (!okC && !okW && !okF) {
        msg.textContent = "Enter at least one measurement: chest 70-150 cm, waist 55-150 cm or foot 20-34 cm.";
        return;
      }
      msg.textContent = "";

      var shirt = "Add chest size", pants = "Add waist size", shoes = "Add foot length";
      if (okC) shirt = chest < 92 ? "S" : chest < 100 ? "M" : chest < 108 ? "L" : chest < 116 ? "XL" : "XXL (ask us)";
      if (okW) {
        var n = Math.round(waist / 2.54 / 2) * 2;
        pants = String(Math.min(Math.max(n, 28), 36)) + (n > 36 ? "+ (ask us)" : "");
      }
      if (okF) shoes = "EU " + Math.round((foot + 1.5) * 1.5);

      var res = doc.getElementById("results");
      res.style.display = "block";
      res.classList.remove("show"); void res.offsetWidth; res.classList.add("show");
      $$(".stat", res).forEach(function (s, i) { s.style.animationDelay = (i * 0.08) + "s"; });
      put("r-shirt", shirt); put("r-pants", pants); put("r-shoes", shoes);
      res.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
    });
  }

  /* =====================  PAGE MOTION  ===================== */
  var progress, hero, topBtn, ticking = false;

  function makeTopButton() {
    topBtn = doc.createElement("button");
    topBtn.id = "top"; topBtn.type = "button";
    topBtn.setAttribute("aria-label", "Back to top");
    topBtn.innerHTML = "&#8593;";
    topBtn.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }); });
    doc.body.appendChild(topBtn);
  }

  function onScroll() {
    var y = window.pageYOffset || root.scrollTop, h = root.scrollHeight - window.innerHeight;
    if (progress) progress.style.width = (h > 0 ? (y / h) * 100 : 0) + "%";
    if (topBtn) topBtn.classList.toggle("show", y > 500);
    ticking = false;
  }

  function initScroll() {
    progress = $("#progress");
    hero = $(".hero, .page-hero");
    makeTopButton();
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
    }, { passive: true });
    onScroll();
  }

  function initHero() {
    if (!hero) return;
    var h1 = $("h1", hero);
    if (h1) {
      var hl = parseInt(h1.getAttribute("data-hl") || "0", 10);
      var words = h1.textContent.trim().split(/\s+/);
      if (!reduce) {
        h1.textContent = "";
        words.forEach(function (w, i) {
          var s = doc.createElement("span");
          s.className = "w" + (hl && i >= words.length - hl ? " hl" : "");
          s.style.animationDelay = (0.1 + i * 0.09) + "s";
          s.textContent = w;
          h1.appendChild(s);
          if (i < words.length - 1) h1.appendChild(doc.createTextNode(" "));
        });
      } else if (hl) {
        h1.innerHTML = C.esc(words.slice(0, words.length - hl).join(" ")) + ' <span class="hl">' + C.esc(words.slice(words.length - hl).join(" ")) + "</span>";
      }
    }
    if (!reduce && window.matchMedia && window.matchMedia("(hover: hover)").matches) {
      hero.addEventListener("mousemove", function (e) {
        var r = hero.getBoundingClientRect();
        hero.style.setProperty("--px", (((e.clientX - r.left) / r.width - 0.5) * 36) + "px");
        hero.style.setProperty("--py", (((e.clientY - r.top) / r.height - 0.5) * 26) + "px");
      });
    }
  }

  function initReveal() {
    if (reduce || !("IntersectionObserver" in window)) return;
    var sel = "main h2, main .eyebrow, main .sec-head p, main .step, main .tile, main .panel, main .toolbar, main details, main .table-wrap, main .closing .btn";
    var all = $$(sel).filter(function (el) { return !el.closest(".hero") && !el.closest(".page-hero") && !el.closest(".results"); });
    var targets = all.filter(function (el) { return !all.some(function (o) { return o !== el && o.contains(el); }); });
    var seen = new Map();
    targets.forEach(function (el) {
      var n = seen.get(el.parentNode) || 0;
      seen.set(el.parentNode, n + 1);
      el.classList.add("reveal");
      if (el.matches("h2")) el.classList.add("from-left");
      else if (el.matches(".step, .tile")) el.classList.add("zoom");
      el.style.setProperty("--d", (el.parentNode.matches(".steps, .tiles") ? n * 0.1 : 0) + "s");
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    targets.forEach(function (el) {
      el.addEventListener("transitionend", function (e) {
        if (e.target === el && e.propertyName === "opacity") {
          el.classList.remove("reveal", "in", "from-left", "zoom");
          el.style.removeProperty("--d");
        }
      });
      io.observe(el);
    });
  }

  function initDock() {
    var target = $("#size-finder");
    if (!target || !("IntersectionObserver" in window)) return;
    var home = $('.dock a[href="index.html"]'), size = $('.dock a[href="index.html#size-finder"]');
    if (!home || !size) return;
    new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        size.classList.toggle("is-active", en.isIntersecting);
        home.classList.toggle("is-active", !en.isIntersecting);
      });
    }, { rootMargin: "-35% 0px -35% 0px" }).observe(target);
  }

  /* =====================  START  ===================== */
  function init() {
    state = loadSeed();
    // The page already contains pre-built product cards, so only wire up filters here.
    if (state) { fillColourFilter(); updateTileCounts();  }
    initControls();
    initSizeFinder();
    initScroll();
    initHero();
    initReveal();
    initDock();
  }

  if (doc.readyState !== "loading") init();
  else doc.addEventListener("DOMContentLoaded", init);
})();
