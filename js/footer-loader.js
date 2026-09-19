/**
 * Neptune Logistics shared footer loader.
 */
(function () {
  'use strict';

  const placeholder = document.getElementById('footer-placeholder');
  if (!placeholder) return;

  const isSubdir = window.location.pathname.includes('/services/') || window.location.pathname.includes('/industries/');
  const root = isSubdir ? '../' : './';

  function adjustPaths(html) {
    if (!isSubdir) return html;
    return html.replace(/(href|src)="(?!https?:\/\/|#|tel:|mailto:|\/)/g, `$1="${root}`);
  }

  function setFooterYear() {
    const year = placeholder.querySelector('#year');
    if (year) year.textContent = new Date().getFullYear();
  }

  function mountFooter(html) {
    placeholder.innerHTML = adjustPaths(html);
    setFooterYear();
  }

  const token = 'v=1789815146217';

  fetch(root + 'components/footer.partial?' + token)
    .then(function (r) {
      if (!r.ok) throw new Error('Footer relative partial failed: ' + r.status);
      return r.text();
    })
    .then(mountFooter)
    .catch(function () {
      fetch('/components/footer.partial?' + token)
        .then(function (r) {
          if (!r.ok) throw new Error('Footer root partial failed: ' + r.status);
          return r.text();
        })
        .then(mountFooter)
        .catch(function () {
          fetch(root + 'components/footer.html?' + token)
            .then(function (r) {
              if (!r.ok) throw new Error('Footer relative html failed: ' + r.status);
              return r.text();
            })
            .then(mountFooter)
            .catch(function () {
              fetch('/components/footer.html?' + token)
                .then(function (r) {
                  if (!r.ok) throw new Error('Footer root html failed: ' + r.status);
                  return r.text();
                })
                .then(mountFooter);
            });
        });
    });
})();
