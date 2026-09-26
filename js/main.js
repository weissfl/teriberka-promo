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
})();
