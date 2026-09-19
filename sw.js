/**
 * Neptune Logistics — Service Worker
 * Enables seamless extensionless clean URLs across local development environments
 * (VS Code Live Server, static preview servers) and offline resilience.
 */

const SW_VERSION = 'v1.0.2';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Only handle GET navigation requests on the same origin
  if (req.method !== 'GET' || req.mode !== 'navigate') {
    return;
  }

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  let pathname = url.pathname;
  if (pathname.length > 1 && pathname.endsWith('/')) {
    pathname = pathname.slice(0, -1);
  }

  // Check if this is an extensionless path (not a static asset file with an extension)
  const lastPart = pathname.substring(pathname.lastIndexOf('/') + 1);
  if (lastPart && !lastPart.includes('.')) {
    event.respondWith(
      fetch(req).then((res) => {
        // If server natively returned 200 (e.g. Apache with .htaccess on cPanel or dev-server.py)
        if (res.status === 200) {
          return res;
        }

        // If server returned 404 (e.g. VS Code Live Server lacking rewrite rules)
        if (res.status === 404) {
          const htmlTarget = pathname + '.html' + url.search;
          return fetch(htmlTarget).then((htmlRes) => {
            if (htmlRes.ok) return htmlRes;
            return res;
          }).catch(() => res);
        }

        return res;
      }).catch(() => {
        // Fallback if network failed or server unreachable
        const htmlTarget = pathname + '.html' + url.search;
        return fetch(htmlTarget).catch(() => fetch('/404.html'));
      })
    );
  }
});
