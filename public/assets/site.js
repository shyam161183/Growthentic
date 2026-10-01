/* Growthentic site behaviour: menu, cookie consent, analytics (after consent), forms. */
(function () {
  "use strict";
  var CFG = window.GT_CONFIG || {};
  var WA = CFG.whatsapp || "https://wa.me/37063236893";
  var CONSENT_KEY = "gt_consent_v1";

  function store(get, val) {
    try {
      if (get) return window.localStorage.getItem(CONSENT_KEY);
      window.localStorage.setItem(CONSENT_KEY, val);
    } catch (e) { /* storage unavailable, banner will show each visit */ }
    return null;
  }

  /* Analytics loads only after consent. Set gaId in the config to enable. */
  function loadAnalytics() {
    if (!CFG.gaId || window.__gtLoaded) return;
    window.__gtLoaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("consent", "default", { analytics_storage: "granted" });
    window.gtag("js", new Date());
    window.gtag("config", CFG.gaId);
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(CFG.gaId);
    document.head.appendChild(s);
  }
  function track(name, params) {
    if (window.gtag && window.__gtLoaded) window.gtag("event", name, params || {});
  }

  /* Mobile menu */
  var menuBtn = document.getElementById("menu-btn");
  var nav = document.getElementById("site-nav");
  if (menuBtn && nav) {
    menuBtn.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.addEventListener("click", function (e) {
      if (e.target.tagName === "A") { nav.classList.remove("open"); menuBtn.setAttribute("aria-expanded", "false"); }
    });
  }

  /* Cookie banner */
  var banner = document.getElementById("cookie");
  var waFloat = document.querySelector(".wa-float");
  function hideBanner() {
    if (banner) banner.hidden = true;
    if (waFloat) waFloat.classList.remove("lifted");
  }
  function showBanner(prefs) {
    if (!banner) return;
    banner.hidden = false;
    banner.classList.toggle("show-prefs", !!prefs);
    if (waFloat) waFloat.classList.add("lifted");
  }
  function decide(value) {
    store(false, value);
    if (value === "all") loadAnalytics();
    hideBanner();
  }
  var saved = store(true);
  if (saved === "all") { loadAnalytics(); hideBanner(); }
  else if (saved === "essential") { hideBanner(); }
  else { showBanner(false); }
  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-consent]");
    if (t) {
      var v = t.getAttribute("data-consent");
      if (v === "prefs") { if (banner) banner.classList.toggle("show-prefs"); return; }
      if (v === "save") {
        var box = document.getElementById("consent-analytics");
        decide(box && box.checked ? "all" : "essential");
        return;
      }
      decide(v);
      return;
    }
    if (e.target.closest("[data-open-cookies]")) { e.preventDefault(); showBanner(true); }
    var w = e.target.closest("[data-track]");
    if (w) track(w.getAttribute("data-track"), { label: (w.getAttribute("data-label") || w.textContent || "").trim().slice(0, 60) });
  });

  /* Lead forms: POST JSON to CFG.formEndpoint (Formspree) when set, otherwise hand the details over on WhatsApp */
  function serialise(form) {
    var data = {}, lines = [];
    var fd = new FormData(form);
    fd.forEach(function (val, key) {
      if (key === "website_hp" || key === "consent") return;
      if (data[key] === undefined) data[key] = val; else data[key] += ", " + val;
    });
    Object.keys(data).forEach(function (k) {
      var label = form.querySelector('[name="' + k + '"]');
      var name = label && label.getAttribute("data-label") || k;
      if (data[k]) lines.push(name + ": " + data[k]);
    });
    return { data: data, text: lines.join("\n") };
  }
  Array.prototype.forEach.call(document.querySelectorAll("form[data-form]"), function (form) {
    var msg = form.querySelector(".form-msg");
    function say(kind, text) {
      if (!msg) return;
      msg.className = "form-msg " + kind;
      msg.textContent = text;
      msg.setAttribute("role", kind === "err" ? "alert" : "status");
    }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var hp = form.querySelector('[name="website_hp"]');
      if (hp && hp.value) return; /* bots fill the honeypot */
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var kind = form.getAttribute("data-form");
      var subject = kind === "audit" ? "PPC audit request" : (kind === "home" ? "Home page lead" : "Contact page lead");
      var out = serialise(form);
      out.data.form = kind;
      out.data.page = window.location.pathname;
      var btn = form.querySelector("button[type=submit]");
      var okText = form.getAttribute("data-success") || "Thanks. We have your details.";
      var waHref = WA + "?text=" + encodeURIComponent("Hi Growthentic, " + subject.toLowerCase() + ":\n" + out.text);
      var errText = "Something went wrong. Please try again, or message us on WhatsApp.";
      track("generate_lead", { form_name: kind });
      if (CFG.formEndpoint) {
        if (btn) btn.disabled = true;
        fetch(CFG.formEndpoint, { method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" }, body: JSON.stringify(out.data) })
          .then(function (r) { if (!r.ok) throw new Error("bad status"); form.reset(); say("ok", okText); })
          .catch(function () { say("err", errText); })
          .then(function () { if (btn) btn.disabled = false; });
      } else {
        /* No backend connected yet: open WhatsApp with the details filled in */
        say("ok", "Thanks. WhatsApp should open with your details ready to send.");
        window.open(waHref, "_blank", "noopener");
      }
    });
  });

  /* Audit form: nudge people who are not running ads yet */
  var spend = document.getElementById("audit-spend");
  var spendHint = document.getElementById("audit-spend-hint");
  if (spend && spendHint) {
    spend.addEventListener("change", function () { spendHint.hidden = spend.value !== "Not running ads yet"; });
  }

  var yr = document.querySelectorAll("[data-year]");
  Array.prototype.forEach.call(yr, function (n) { n.textContent = new Date().getFullYear(); });
})();

/* Work page: industry filter and click-to-play videos (YouTube loads only when a visitor presses play) */
(function () {
  "use strict";
  var bar = document.querySelector("[data-filter-bar]");
  if (bar) {
    bar.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-filter]");
      if (!b) return;
      var f = b.getAttribute("data-filter");
      Array.prototype.forEach.call(bar.querySelectorAll("button"), function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
      Array.prototype.forEach.call(document.querySelectorAll("[data-industry]"), function (card) {
        card.hidden = f !== "all" && card.getAttribute("data-industry") !== f;
      });
    });
  }
  Array.prototype.forEach.call(document.querySelectorAll(".yt[data-yt]"), function (box) {
    var id = box.getAttribute("data-yt");
    var btn = box.querySelector("button");
    box.style.backgroundImage = "url(https://i.ytimg.com/vi/" + id + "/hqdefault.jpg)";
    if (!btn) return;
    btn.addEventListener("click", function () {
      var f = document.createElement("iframe");
      f.src = "https://www.youtube-nocookie.com/embed/" + id + "?autoplay=1&rel=0";
      f.title = btn.getAttribute("aria-label") || "Video";
      f.allow = "accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture";
      f.allowFullscreen = true;
      box.innerHTML = "";
      box.appendChild(f);
      box.classList.add("playing");
    });
  });
})();
