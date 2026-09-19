/**
 * Neptune Logistics — Shared Navbar Loader
 * Fetches components/navbar.html into #navbar-placeholder, then hands off
 * to initNavbar() (defined in uthao-interactions.js) to wire up behavior.
 */
(function () {
  const placeholder = document.getElementById('navbar-placeholder');
  if (!placeholder) return;

  const isSubdir = window.location.pathname.includes('/services/') || window.location.pathname.includes('/industries/');
  const root = isSubdir ? '../' : './';

  function adjustPaths(html) {
    return html.replace(/(href|src)="(?!https?:\/\/|#|tel:|mailto:|\/)/g, `$1="${root}`);
  }

  fetch(root + 'components/navbar.html?v=2.0.0')
    .then((r) => r.text())
    .then((html) => {
      placeholder.innerHTML = isSubdir ? adjustPaths(html) : html;
      if (typeof initNavbar === 'function') {
        initNavbar();
      } else {
        // uthao-interactions.js hasn't finished loading yet in some edge case; retry once it has.
        window.addEventListener('load', () => { if (typeof initNavbar === 'function') initNavbar(); });
      }
    });
})();
