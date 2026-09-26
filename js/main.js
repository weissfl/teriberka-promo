/* Teriberka one-page site: nav, scroll reveals, lightbox, back-to-top.
   Progressive enhancement only — the page is fully readable without JS. */

(function () {
  "use strict";

  document.body.classList.add("js");

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Mobile menu */
  var burger = document.querySelector(".burger");
  if (burger) {
    burger.addEventListener("click", function () {
      var open = document.body.classList.toggle("menu-open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.querySelectorAll(".menu a").forEach(function (a) {
      a.addEventListener("click", function () {
        document.body.classList.remove("menu-open");
        burger.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* Scroll reveals */
  /* Animated fact counters (final values are already in the HTML;
     without JS or under reduced motion nothing changes) */
  function startCount(el) {
    if (el.dataset.done) return;
    el.dataset.done = "1";
    var target = parseInt(el.getAttribute("data-count"), 10);
    var prefix = el.getAttribute("data-prefix") || "";
    var suffix = el.getAttribute("data-suffix") || "";
    var t0 = null;
    function step(ts) {
      if (t0 === null) t0 = ts;
      var p = Math.min((ts - t0) / 1200, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = prefix + Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  var revealEls = document.querySelectorAll(".reveal");
  if (reducedMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("visible"); });
  } else {
    var ioHealthy = false;
    var io = new IntersectionObserver(function (entries) {
      ioHealthy = true;
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          io.unobserve(entry.target);
          entry.target.querySelectorAll("[data-count]").forEach(startCount);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
    // If the renderer never delivers IO callbacks (throttled/broken),
    // show all content instead of hiding it forever.
    setTimeout(function () {
      if (!ioHealthy) {
        revealEls.forEach(function (el) { el.classList.add("visible"); });
      }
    }, 3000);
  }

  /* Active nav item */
  var sections = document.querySelectorAll("main section[id]");
  var navLinks = document.querySelectorAll(".menu a[href^='#']");
  if ("IntersectionObserver" in window && sections.length && navLinks.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (a) {
          a.classList.toggle("active", a.getAttribute("href") === "#" + entry.target.id);
        });
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* Gallery lightbox */
  var lightbox = document.getElementById("lightbox");
  var shots = document.querySelectorAll(".shot");
  if (lightbox && shots.length) {
    var lbImg = lightbox.querySelector(".lb-img");
    var lbCap = lightbox.querySelector(".lb-caption");
    var items = Array.prototype.map.call(shots, function (btn) {
      var img = btn.querySelector("img");
      return { src: img.src, alt: img.alt, cap: btn.querySelector(".shot-cap").textContent };
    });
    var current = 0;

    function show(i) {
      current = (i + items.length) % items.length;
      lbImg.src = items[current].src;
      lbImg.alt = items[current].alt;
      lbCap.textContent = items[current].cap;
    }
    shots.forEach(function (btn, i) {
      btn.addEventListener("click", function () {
        show(i);
        if (typeof lightbox.showModal === "function") lightbox.showModal();
        else lightbox.setAttribute("open", "");
      });
    });
    lightbox.querySelector(".lb-close").addEventListener("click", function () { lightbox.close(); });
    lightbox.querySelector(".lb-prev").addEventListener("click", function () { show(current - 1); });
    lightbox.querySelector(".lb-next").addEventListener("click", function () { show(current + 1); });
    lightbox.addEventListener("click", function (e) {
      if (e.target === lightbox) lightbox.close();
    });
    lightbox.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") show(current - 1);
      if (e.key === "ArrowRight") show(current + 1);
    });
  }

  /* Back to top */
  var toTop = document.querySelector(".to-top");
  if (toTop) {
    window.addEventListener("scroll", function () {
      toTop.classList.toggle("show", window.scrollY > 900);
    }, { passive: true });
    toTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
    });
  }

  /* Reading progress bar */
  var progress = document.querySelector(".read-progress");
  if (progress) {
    var updateProgress = function () {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var p = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
      progress.style.transform = "scaleX(" + p + ")";
    };
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);
    updateProgress();
  }

  /* Trip planner: desire -> season, months and caveats */
  var plannerWants = document.querySelector(".planner-wants");
  if (plannerWants) {
    var PLANNER = {
      whales: {
        season: "Май — август",
        months: [5, 6, 7, 8],
        text: "С мая по август к берегу подходят кормиться горбачи — главные киты Териберки. " +
          "Регулярно встречаются малые полосатики, изредка — косатки, финвалы и белухи.",
        note: "Встреча не гарантирована: киты — дикие животные, а в шторм выходы в море отменяют. " +
          "В высокий сезон жильё занимают заранее."
      },
      aurora: {
        season: "Сентябрь — начало апреля",
        months: [9, 10, 11, 12, 1, 2, 3],
        text: "С сентября по март — начало апреля сияния возможны в любую ясную ночь. Пик — " +
          "полярная ночь: с 1 декабря по 12 января солнце не поднимается 43 дня.",
        note: "Нужны солнечная активность и чистое небо — гарантий нет. Зимой возможны метели: " +
          "дорогу периодически закрывают."
      },
      polar: {
        season: "Конец мая — конец июля",
        months: [5, 6, 7],
        text: "Примерно с конца мая до конца июля солнце не заходит вовсе: море, тундра и сопки " +
          "в круглосуточном свету — это же разгар сезона китов.",
        note: "Ночей нет вообще: плотные шторы не помешают."
      },
      fest: {
        season: "Сентябрь",
        months: [9],
        text: "Ежегодный арктический фестиваль «Териберка» проходит в сентябре и идёт с 2015 года: " +
          "музыка, гастрономическая программа, эко-проекты.",
        note: "В фестивальные дни гостей особенно много — жильё стоит бронировать сильно заранее."
      }
    };
    var monthCells = document.querySelectorAll(".planner-months span");
    var pSeason = document.querySelector(".planner-season");
    var pText = document.querySelector(".planner-text");
    var pNote = document.querySelector(".planner-note");
    function showWant(key) {
      var d = PLANNER[key];
      if (!d) return;
      monthCells.forEach(function (s) {
        s.classList.toggle("on", d.months.indexOf(+s.getAttribute("data-m")) !== -1);
      });
      pSeason.textContent = d.season;
      pText.textContent = d.text;
      pNote.textContent = d.note;
    }
    plannerWants.addEventListener("click", function (e) {
      var btn = e.target.closest(".chip");
      if (!btn) return;
      plannerWants.querySelectorAll(".chip").forEach(function (b) {
        b.setAttribute("aria-pressed", b === btn ? "true" : "false");
      });
      showWant(btn.getAttribute("data-want"));
    });
    showWant("whales");
  }
})();
