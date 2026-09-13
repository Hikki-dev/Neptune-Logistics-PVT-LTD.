/**
 * Neptune Logistics GA4 loader.
 * Set window.NEPTUNE_GA4_ID to the live G measurement ID before this file runs.
 */
(function () {
  'use strict';

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () {
    window.dataLayer.push(arguments);
  };

  var measurementId = window.NEPTUNE_GA4_ID;

  if (!measurementId || !/^G-[A-Z0-9]+$/.test(measurementId)) {
    return;
  }

  // Only fire real analytics once the visitor has accepted the cookie banner
  // (js/uthao-interactions.js initCookieConsent) — 'declined' or not yet
  // decided both skip loading GA.
  if (localStorage.getItem('neptune-cookie-consent') !== 'accepted') {
    return;
  }

  var gaScript = document.createElement('script');
  gaScript.async = true;
  gaScript.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(measurementId);
  document.head.appendChild(gaScript);

  window.gtag('js', new Date());
  window.gtag('config', measurementId);
})();
