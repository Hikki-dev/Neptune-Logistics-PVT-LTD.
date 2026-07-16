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
    if (isSubdir) {
      html = html.replace(/href="\/(?!\/)/g, 'href="../');
      html = html.replace(/src="\/(?!\/)/g, 'src="../');
    } else {
      html = html.replace(/href="\/(?!\/)/g, 'href="./');
      html = html.replace(/src="\/(?!\/)/g, 'src="./');
    }
    return html;
  }

  function setFooterYear() {
    const year = placeholder.querySelector('#year');
    if (year) year.textContent = new Date().getFullYear();
  }

  fetch(root + 'components/footer.partial?v=1.0.1')
    .then(function (response) { return response.text(); })
    .then(function (html) {
      placeholder.innerHTML = adjustPaths(html);
      setFooterYear();
    })
    .catch(function () {
      fetch('/components/footer.partial?v=1.0.1')
        .then(function (response) { return response.text(); })
        .then(function (html) {
          placeholder.innerHTML = adjustPaths(html);
          setFooterYear();
        });
    });
})();
