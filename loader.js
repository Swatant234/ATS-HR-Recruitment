/* ============================================================
   Global Page Loader — ProvenTech ATS
   Include with a single line right after <body>:
     <script src="loader.js"></script>
   Styles live in global.css (#pageLoader, .pl-inner, .pl-spinner, etc).
   Uses document.write so the loader paints immediately at the
   point the script tag sits in the HTML — same effect as the
   inline markup it replaces, but defined in one place.
   ============================================================ */
(function () {
  document.write(
    '<div id="pageLoader">' +
      '<div class="pl-inner">' +
        '<div class="pl-spinner"></div>' +
        '<div class="pl-word">ProvenTech</div>' +
        '<div class="pl-status">Loading, please wait<span class="pl-dots"><span>.</span><span>.</span><span>.</span></span></div>' +
      '</div>' +
    '</div>'
  );

  var MIN_MS = 550, start = Date.now();

  function hide() {
    var el = document.getElementById('pageLoader');
    if (!el) return;
    var wait = Math.max(0, MIN_MS - (Date.now() - start));
    setTimeout(function () {
      el.classList.add('pl-hide');
      setTimeout(function () { el.remove(); }, 500);
    }, wait);
  }

  if (document.readyState === 'complete') { hide(); }
  else { window.addEventListener('load', hide); }
})();
