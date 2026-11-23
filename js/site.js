// Home page hero: cross-fades through every stay's main photo. Without JS the first photo stays put.
(function () {
  var slides = Array.prototype.slice.call(document.querySelectorAll(".hero .slide"));
  if (slides.length < 2) return;
  var link = document.querySelector(".slide-link");
  var title = link.querySelector(".slide-title");
  var area = link.querySelector(".slide-area");
  var pause = document.querySelector(".slide-pause");
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var current = 0;
  var timer = null;
  var paused = reduced;

  function load(i) {
    var im = slides[i].querySelector("img");
    if (im.dataset.srcset) { im.srcset = im.dataset.srcset; delete im.dataset.srcset; }
    if (im.dataset.src) { im.src = im.dataset.src; delete im.dataset.src; }
    return im;
  }

  function go(i) {
    var next = (i + slides.length) % slides.length;
    var im = load(next);
    function swap() {
      slides[current].querySelector("img").classList.remove("is-active");
      im.classList.add("is-active");
      current = next;
      title.textContent = slides[next].dataset.title;
      area.textContent = slides[next].dataset.area;
      link.href = slides[next].dataset.href;
      load((next + 1) % slides.length);
    }
    if (im.complete && im.naturalWidth) swap();
    else im.addEventListener("load", swap, { once: true });
  }

  function start() { stop(); timer = setInterval(function () { go(current + 1); }, 6000); }
  function stop() { if (timer) clearInterval(timer); timer = null; }
  function setPaused(p) {
    paused = p;
    pause.setAttribute("aria-pressed", String(p));
    pause.setAttribute("aria-label", p ? "Play slideshow" : "Pause slideshow");
    pause.textContent = p ? "▶" : "❚❚";
    if (p) stop(); else start();
  }

  pause.hidden = false;
  pause.addEventListener("click", function () { setPaused(!paused); });
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stop(); else if (!paused) start();
  });
  load(1);
  setPaused(paused);
})();

// Photo viewer for stay pages. Pages work without it: photos still show in the grid.
(function () {
  var data = document.getElementById("photo-data");
  var box = document.querySelector(".lightbox");
  if (!data || !box || typeof box.showModal !== "function") return;
  var photos = JSON.parse(data.textContent);
  var img = box.querySelector("img");
  var count = box.querySelector(".lb-count");
  var index = 0;
  var opener = null;

  function show(i) {
    index = (i + photos.length) % photos.length;
    img.src = photos[index].src;
    img.alt = photos[index].alt;
    count.textContent = (index + 1) + " / " + photos.length;
  }

  document.querySelectorAll("[data-index]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      opener = btn;
      show(Number(btn.dataset.index));
      box.showModal();
    });
  });
  box.querySelector(".lb-prev").addEventListener("click", function () { show(index - 1); });
  box.querySelector(".lb-next").addEventListener("click", function () { show(index + 1); });
  box.querySelector(".lb-close").addEventListener("click", function () { box.close(); });
  box.addEventListener("click", function (e) { if (e.target === box) box.close(); });
  document.addEventListener("keydown", function (e) {
    if (!box.open) return;
    if (e.key === "ArrowLeft") show(index - 1);
    if (e.key === "ArrowRight") show(index + 1);
  });
  box.addEventListener("close", function () { if (opener) opener.focus(); });

  var startX = null;
  box.addEventListener("touchstart", function (e) { startX = e.touches[0].clientX; }, { passive: true });
  box.addEventListener("touchend", function (e) {
    if (startX === null) return;
    var dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1));
    startX = null;
  });
})();
