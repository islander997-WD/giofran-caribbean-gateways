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
    pause.setAttribute("aria-label", p ? pause.dataset.play : pause.dataset.pause);
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

// Home page map of the three areas. The list beside it carries the same information.
(function () {
  var el = document.getElementById("area-map");
  var data = document.getElementById("map-data");
  if (!el || !data || !window.L) return;
  var pins = JSON.parse(data.textContent);
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  L.Icon.Default.imagePath = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/";
  var map = L.map(el, {
    scrollWheelZoom: false,
    zoomAnimation: !reduced, fadeAnimation: !reduced, markerZoomAnimation: !reduced
  });
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 17,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);
  var bounds = [];
  pins.forEach(function (p) {
    var popup = document.createElement("div");
    var name = document.createElement("strong");
    name.textContent = p.name;
    var town = document.createElement("p");
    town.textContent = p.town;
    var link = document.createElement("a");
    link.href = p.href;
    link.textContent = p.link;
    popup.append(name, town, link);
    L.marker([p.lat, p.lng], { title: p.name, alt: p.name, keyboard: true }).addTo(map).bindPopup(popup);
    bounds.push([p.lat, p.lng]);
  });
  map.fitBounds(bounds, { padding: [60, 60], maxZoom: 13 });
})();
