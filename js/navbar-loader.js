/**
 * Neptune Logistics — Shared Navbar Loader
 * Fetches components/navbar.partial into #navbar-placeholder, then hands off
 * to initNavbar() (defined in uthao-interactions.js) to wire up behavior.
 */
(function () {
  'use strict';

  const placeholder = document.getElementById('navbar-placeholder');
  if (!placeholder) return;

  const isSubdir = window.location.pathname.includes('/services/') || window.location.pathname.includes('/industries/');
  const root = isSubdir ? '../' : './';

  function adjustPaths(html) {
    return html.replace(/(href|src)="(?!https?:\/\/|#|tel:|mailto:|\/)/g, `$1="${root}`);
  }

  function mountNavbar(html) {
    placeholder.innerHTML = isSubdir ? adjustPaths(html) : html;
    if (typeof initNavbar === 'function') {
      initNavbar();
    } else {
      // uthao-interactions.js hasn't finished loading yet; retry once it has.
      window.addEventListener('load', function () {
        if (typeof initNavbar === 'function') initNavbar();
      });
    }
  }

  const token = 'v=1789818899665';

  // Primary fetch: navbar.partial (immune to Live Server SVG injection bug)
  fetch(root + 'components/navbar.partial?' + token)
    .then(function (r) {
      if (!r.ok) throw new Error('Navbar relative partial failed: ' + r.status);
      return r.text();
    })
    .then(mountNavbar)
    .catch(function () {
      fetch('/components/navbar.partial?' + token)
        .then(function (r) {
          if (!r.ok) throw new Error('Navbar root partial failed: ' + r.status);
          return r.text();
        })
        .then(mountNavbar)
        .catch(function () {
          fetch(root + 'components/navbar.html?' + token)
            .then(function (r) {
              if (!r.ok) throw new Error('Navbar relative html failed: ' + r.status);
              return r.text();
            })
            .then(mountNavbar)
            .catch(function () {
              fetch('/components/navbar.html?' + token)
                .then(function (r) {
                  if (!r.ok) throw new Error('Navbar root html failed: ' + r.status);
                  return r.text();
                })
                .then(mountNavbar);
            });
        });
    });
})();
