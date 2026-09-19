/**
 * Neptune Logistics — Uthao Design System Interactions
 * Matching uthao.webflow.io dynamic animations & controls
 */

/* ==========================================================================
   0. SERVICE WORKER & CLEAN URL ENGINE
   Enables extensionless clean URLs (e.g. /about, /careers, /ocean-cargo)
   across all environments including VS Code Live Server and cPanel.
   ========================================================================== */

// 1. Clean .html from the visible browser address bar if present
(function cleanUrlBar() {
  try {
    if (window.location.protocol.startsWith('http') && window.location.pathname.endsWith('.html')) {
      var cleanPath = window.location.pathname.replace(/\/index\.html$/, '/') || window.location.pathname.replace(/\.html$/, '') || '/';
      window.history.replaceState(null, '', cleanPath + window.location.search + window.location.hash);
    }
  } catch (e) {}
})();

// 2. Register Service Worker for seamless clean URL resolution
if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js').catch(function (err) {
      console.warn('[Neptune SW] Registration notice:', err);
    });
  });
}

// 3. Fallback Link Interceptor for Local Static Servers (e.g. VS Code Live Server)
// When on localhost/127.0.0.1, if Service Worker is not active yet (e.g. instant first click),
// seamlessly routes to .html and cleans address bar so user NEVER sees 404!
document.addEventListener('click', function (e) {
  var anchor = e.target.closest('a');
  if (!anchor || e.defaultPrevented) return;

  // Ignore modified clicks (Ctrl/Cmd click for new tab)
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || anchor.target === '_blank') return;

  var rawHref = anchor.getAttribute('href');
  if (!rawHref || rawHref.startsWith('#') || rawHref.startsWith('mailto:') || rawHref.startsWith('tel:') || rawHref.startsWith('javascript:')) {
    return;
  }

  // Check origin
  var targetUrl;
  try {
    targetUrl = new URL(anchor.href, window.location.origin);
  } catch (err) {
    return;
  }
  if (targetUrl.origin !== window.location.origin) return;

  // Only handle local development environments (VS Code Live Server on localhost / 127.0.0.1)
  var isLocalStatic = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  if (isLocalStatic) {
    var targetPath = targetUrl.pathname;
    if (targetPath === '/' || targetPath === '') return;

    if (targetPath.length > 1 && targetPath.endsWith('/')) {
      targetPath = targetPath.slice(0, -1);
    }
    var lastPart = targetPath.substring(targetPath.lastIndexOf('/') + 1);
    if (lastPart && !lastPart.includes('.')) {
      e.preventDefault();
      window.location.href = targetPath + '.html' + targetUrl.search + targetUrl.hash;
    }
  }
});


/* ==========================================================================
   0. SHARED FORM-TO-EMAIL DELIVERY (Web3Forms)
   Every form on the site (quote wizard, contact form, career application)
   posts here so a real submission actually reaches Neptune's inbox.
   Get a free access key at https://web3forms.com (just enter an email,
   no account/password needed) and paste it in below — until then, forms
   still validate and show a success state, but nothing is delivered.
   ========================================================================== */
const WEB3FORMS_ACCESS_KEY = 'db47306b-6779-4d87-9279-d805de43c70c';

function submitFormData(fields, subject) {
  const payload = new FormData();
  payload.append('access_key', WEB3FORMS_ACCESS_KEY);
  payload.append('subject', subject);
  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      payload.append(key, value);
    }
  });
  return fetch('https://api.web3forms.com/submit', {
    method: 'POST',
    body: payload,
    headers: { Accept: 'application/json' },
  })
    .then((res) => res.json())
    .catch((err) => {
      console.error('[Neptune] Form submission failed to send:', err);
      return { success: false, error: err };
    });
}

document.addEventListener('DOMContentLoaded', () => {
  // initNavbar() runs once js/navbar-loader.js injects the shared navbar markup.
  initIntlPhoneFields();
  initCountryAutocompleteFields();
  initQuoteWizard();
  initContainerShowcase();
  initWorldMapInteractions();
  initFaqAccordion();
  initStatsCounter();
  initShipmentRouteAnimation();
  initEquipmentSwitcher();
  initServicesCarousel();
  initInfiniteMarquees();
  initJobVacancyFilter();
  initCareerApplyModal();
  initCareerDetailPage();
  initContactForm();
  initOfficeLocatorToggle();
  initMobileCollapsibleLists();
  initMobileCardCarousels();
  initCookieConsent();
});

/* ==========================================================================
   0b. INTERNATIONAL PHONE INPUT (country dropdown, searchable, digit-limited)
   Every real phone field on the site is wrapped with this: a flag+dial-code
   button that opens a type-to-filter country list, next to a plain number
   input constrained to that country's digit length. The original input
   (whatever id/name existing form logic already reads) becomes a hidden
   carrier of the combined "+<dial><digits>" value, so no other code needs
   to change.
   ========================================================================== */
const WORLD_COUNTRIES = [
  { name: 'Afghanistan', flag: '🇦🇫', dial: '93', digits: 9, placeholder: '00 000 0000' },
  { name: 'Albania', flag: '🇦🇱', dial: '355', digits: 9, placeholder: '00 000 0000' },
  { name: 'Algeria', flag: '🇩🇿', dial: '213', digits: 9, placeholder: '00 000 0000' },
  { name: 'Andorra', flag: '🇦🇩', dial: '376', digits: 6, placeholder: '000000' },
  { name: 'Angola', flag: '🇦🇴', dial: '244', digits: 9, placeholder: '00 000 0000' },
  { name: 'Antigua and Barbuda', flag: '🇦🇬', dial: '1268', digits: 7, placeholder: '000 0000' },
  { name: 'Argentina', flag: '🇦🇷', dial: '54', digits: 10, placeholder: '000 000 0000' },
  { name: 'Armenia', flag: '🇦🇲', dial: '374', digits: 8, placeholder: '00 000 000' },
  { name: 'Australia', flag: '🇦🇺', dial: '61', digits: 9, placeholder: '00 000 0000' },
  { name: 'Austria', flag: '🇦🇹', dial: '43', digits: 10, placeholder: '000 000 0000' },
  { name: 'Azerbaijan', flag: '🇦🇿', dial: '994', digits: 9, placeholder: '00 000 0000' },
  { name: 'Bahamas', flag: '🇧🇸', dial: '1242', digits: 7, placeholder: '000 0000' },
  { name: 'Bahrain', flag: '🇧🇭', dial: '973', digits: 8, placeholder: '00 000 000' },
  { name: 'Bangladesh', flag: '🇧🇩', dial: '880', digits: 10, placeholder: '000 000 0000' },
  { name: 'Barbados', flag: '🇧🇧', dial: '1246', digits: 7, placeholder: '000 0000' },
  { name: 'Belarus', flag: '🇧🇾', dial: '375', digits: 9, placeholder: '00 000 0000' },
  { name: 'Belgium', flag: '🇧🇪', dial: '32', digits: 9, placeholder: '00 000 0000' },
  { name: 'Belize', flag: '🇧🇿', dial: '501', digits: 7, placeholder: '000 0000' },
  { name: 'Benin', flag: '🇧🇯', dial: '229', digits: 8, placeholder: '00 000 000' },
  { name: 'Bhutan', flag: '🇧🇹', dial: '975', digits: 8, placeholder: '00 000 000' },
  { name: 'Bolivia', flag: '🇧🇴', dial: '591', digits: 8, placeholder: '00 000 000' },
  { name: 'Bosnia and Herzegovina', flag: '🇧🇦', dial: '387', digits: 8, placeholder: '00 000 000' },
  { name: 'Botswana', flag: '🇧🇼', dial: '267', digits: 8, placeholder: '00 000 000' },
  { name: 'Brazil', flag: '🇧🇷', dial: '55', digits: 11, placeholder: '000 0000 0000' },
  { name: 'Brunei', flag: '🇧🇳', dial: '673', digits: 7, placeholder: '000 0000' },
  { name: 'Bulgaria', flag: '🇧🇬', dial: '359', digits: 9, placeholder: '00 000 0000' },
  { name: 'Burkina Faso', flag: '🇧🇫', dial: '226', digits: 8, placeholder: '00 000 000' },
  { name: 'Burundi', flag: '🇧🇮', dial: '257', digits: 8, placeholder: '00 000 000' },
  { name: 'Cambodia', flag: '🇰🇭', dial: '855', digits: 9, placeholder: '00 000 0000' },
  { name: 'Cameroon', flag: '🇨🇲', dial: '237', digits: 9, placeholder: '00 000 0000' },
  { name: 'Canada', flag: '🇨🇦', dial: '1', digits: 10, placeholder: '000 000 0000' },
  { name: 'Cape Verde', flag: '🇨🇻', dial: '238', digits: 7, placeholder: '000 0000' },
  { name: 'Central African Republic', flag: '🇨🇫', dial: '236', digits: 8, placeholder: '00 000 000' },
  { name: 'Chad', flag: '🇹🇩', dial: '235', digits: 8, placeholder: '00 000 000' },
  { name: 'Chile', flag: '🇨🇱', dial: '56', digits: 9, placeholder: '00 000 0000' },
  { name: 'China', flag: '🇨🇳', dial: '86', digits: 11, placeholder: '000 0000 0000' },
  { name: 'Colombia', flag: '🇨🇴', dial: '57', digits: 10, placeholder: '000 000 0000' },
  { name: 'Comoros', flag: '🇰🇲', dial: '269', digits: 7, placeholder: '000 0000' },
  { name: 'Congo (DRC)', flag: '🇨🇩', dial: '243', digits: 9, placeholder: '00 000 0000' },
  { name: 'Congo (Republic)', flag: '🇨🇬', dial: '242', digits: 9, placeholder: '00 000 0000' },
  { name: 'Costa Rica', flag: '🇨🇷', dial: '506', digits: 8, placeholder: '00 000 000' },
  { name: 'Croatia', flag: '🇭🇷', dial: '385', digits: 9, placeholder: '00 000 0000' },
  { name: 'Cuba', flag: '🇨🇺', dial: '53', digits: 8, placeholder: '00 000 000' },
  { name: 'Cyprus', flag: '🇨🇾', dial: '357', digits: 8, placeholder: '00 000 000' },
  { name: 'Czech Republic', flag: '🇨🇿', dial: '420', digits: 9, placeholder: '00 000 0000' },
  { name: 'Denmark', flag: '🇩🇰', dial: '45', digits: 8, placeholder: '00 000 000' },
  { name: 'Djibouti', flag: '🇩🇯', dial: '253', digits: 8, placeholder: '00 000 000' },
  { name: 'Dominica', flag: '🇩🇲', dial: '1767', digits: 7, placeholder: '000 0000' },
  { name: 'Dominican Republic', flag: '🇩🇴', dial: '1809', digits: 7, placeholder: '000 0000' },
  { name: 'Ecuador', flag: '🇪🇨', dial: '593', digits: 9, placeholder: '00 000 0000' },
  { name: 'Egypt', flag: '🇪🇬', dial: '20', digits: 10, placeholder: '000 000 0000' },
  { name: 'El Salvador', flag: '🇸🇻', dial: '503', digits: 8, placeholder: '00 000 000' },
  { name: 'Equatorial Guinea', flag: '🇬🇶', dial: '240', digits: 9, placeholder: '00 000 0000' },
  { name: 'Eritrea', flag: '🇪🇷', dial: '291', digits: 7, placeholder: '000 0000' },
  { name: 'Estonia', flag: '🇪🇪', dial: '372', digits: 8, placeholder: '00 000 000' },
  { name: 'Eswatini', flag: '🇸🇿', dial: '268', digits: 8, placeholder: '00 000 000' },
  { name: 'Ethiopia', flag: '🇪🇹', dial: '251', digits: 9, placeholder: '00 000 0000' },
  { name: 'Fiji', flag: '🇫🇯', dial: '679', digits: 7, placeholder: '000 0000' },
  { name: 'Finland', flag: '🇫🇮', dial: '358', digits: 9, placeholder: '00 000 0000' },
  { name: 'France', flag: '🇫🇷', dial: '33', digits: 9, placeholder: '00 000 0000' },
  { name: 'Gabon', flag: '🇬🇦', dial: '241', digits: 8, placeholder: '00 000 000' },
  { name: 'Gambia', flag: '🇬🇲', dial: '220', digits: 7, placeholder: '000 0000' },
  { name: 'Georgia', flag: '🇬🇪', dial: '995', digits: 9, placeholder: '00 000 0000' },
  { name: 'Germany', flag: '🇩🇪', dial: '49', digits: 10, placeholder: '000 000 0000' },
  { name: 'Ghana', flag: '🇬🇭', dial: '233', digits: 9, placeholder: '00 000 0000' },
  { name: 'Greece', flag: '🇬🇷', dial: '30', digits: 10, placeholder: '000 000 0000' },
  { name: 'Grenada', flag: '🇬🇩', dial: '1473', digits: 7, placeholder: '000 0000' },
  { name: 'Guatemala', flag: '🇬🇹', dial: '502', digits: 8, placeholder: '00 000 000' },
  { name: 'Guinea', flag: '🇬🇳', dial: '224', digits: 9, placeholder: '00 000 0000' },
  { name: 'Guinea-Bissau', flag: '🇬🇼', dial: '245', digits: 7, placeholder: '000 0000' },
  { name: 'Guyana', flag: '🇬🇾', dial: '592', digits: 7, placeholder: '000 0000' },
  { name: 'Haiti', flag: '🇭🇹', dial: '509', digits: 8, placeholder: '00 000 000' },
  { name: 'Honduras', flag: '🇭🇳', dial: '504', digits: 8, placeholder: '00 000 000' },
  { name: 'Hong Kong', flag: '🇭🇰', dial: '852', digits: 8, placeholder: '00 000 000' },
  { name: 'Hungary', flag: '🇭🇺', dial: '36', digits: 9, placeholder: '00 000 0000' },
  { name: 'Iceland', flag: '🇮🇸', dial: '354', digits: 7, placeholder: '000 0000' },
  { name: 'India', flag: '🇮🇳', dial: '91', digits: 10, placeholder: '000 000 0000' },
  { name: 'Indonesia', flag: '🇮🇩', dial: '62', digits: 11, placeholder: '000 0000 0000' },
  { name: 'Iran', flag: '🇮🇷', dial: '98', digits: 10, placeholder: '000 000 0000' },
  { name: 'Iraq', flag: '🇮🇶', dial: '964', digits: 10, placeholder: '000 000 0000' },
  { name: 'Ireland', flag: '🇮🇪', dial: '353', digits: 9, placeholder: '00 000 0000' },
  { name: 'Israel', flag: '🇮🇱', dial: '972', digits: 9, placeholder: '00 000 0000' },
  { name: 'Italy', flag: '🇮🇹', dial: '39', digits: 10, placeholder: '000 000 0000' },
  { name: 'Ivory Coast', flag: '🇨🇮', dial: '225', digits: 10, placeholder: '000 000 0000' },
  { name: 'Jamaica', flag: '🇯🇲', dial: '1876', digits: 7, placeholder: '000 0000' },
  { name: 'Japan', flag: '🇯🇵', dial: '81', digits: 10, placeholder: '000 000 0000' },
  { name: 'Jordan', flag: '🇯🇴', dial: '962', digits: 9, placeholder: '00 000 0000' },
  { name: 'Kazakhstan', flag: '🇰🇿', dial: '7', digits: 10, placeholder: '000 000 0000' },
  { name: 'Kenya', flag: '🇰🇪', dial: '254', digits: 9, placeholder: '00 000 0000' },
  { name: 'Kiribati', flag: '🇰🇮', dial: '686', digits: 5, placeholder: '00000' },
  { name: 'Kosovo', flag: '🇽🇰', dial: '383', digits: 8, placeholder: '00 000 000' },
  { name: 'Kuwait', flag: '🇰🇼', dial: '965', digits: 8, placeholder: '00 000 000' },
  { name: 'Kyrgyzstan', flag: '🇰🇬', dial: '996', digits: 9, placeholder: '00 000 0000' },
  { name: 'Laos', flag: '🇱🇦', dial: '856', digits: 9, placeholder: '00 000 0000' },
  { name: 'Latvia', flag: '🇱🇻', dial: '371', digits: 8, placeholder: '00 000 000' },
  { name: 'Lebanon', flag: '🇱🇧', dial: '961', digits: 8, placeholder: '00 000 000' },
  { name: 'Lesotho', flag: '🇱🇸', dial: '266', digits: 8, placeholder: '00 000 000' },
  { name: 'Liberia', flag: '🇱🇷', dial: '231', digits: 8, placeholder: '00 000 000' },
  { name: 'Libya', flag: '🇱🇾', dial: '218', digits: 9, placeholder: '00 000 0000' },
  { name: 'Liechtenstein', flag: '🇱🇮', dial: '423', digits: 7, placeholder: '000 0000' },
  { name: 'Lithuania', flag: '🇱🇹', dial: '370', digits: 8, placeholder: '00 000 000' },
  { name: 'Luxembourg', flag: '🇱🇺', dial: '352', digits: 9, placeholder: '00 000 0000' },
  { name: 'Macau', flag: '🇲🇴', dial: '853', digits: 8, placeholder: '00 000 000' },
  { name: 'Madagascar', flag: '🇲🇬', dial: '261', digits: 9, placeholder: '00 000 0000' },
  { name: 'Malawi', flag: '🇲🇼', dial: '265', digits: 9, placeholder: '00 000 0000' },
  { name: 'Malaysia', flag: '🇲🇾', dial: '60', digits: 9, placeholder: '00 000 0000' },
  { name: 'Maldives', flag: '🇲🇻', dial: '960', digits: 7, placeholder: '000 0000' },
  { name: 'Mali', flag: '🇲🇱', dial: '223', digits: 8, placeholder: '00 000 000' },
  { name: 'Malta', flag: '🇲🇹', dial: '356', digits: 8, placeholder: '00 000 000' },
  { name: 'Marshall Islands', flag: '🇲🇭', dial: '692', digits: 7, placeholder: '000 0000' },
  { name: 'Mauritania', flag: '🇲🇷', dial: '222', digits: 8, placeholder: '00 000 000' },
  { name: 'Mauritius', flag: '🇲🇺', dial: '230', digits: 8, placeholder: '00 000 000' },
  { name: 'Mexico', flag: '🇲🇽', dial: '52', digits: 10, placeholder: '000 000 0000' },
  { name: 'Micronesia', flag: '🇫🇲', dial: '691', digits: 7, placeholder: '000 0000' },
  { name: 'Moldova', flag: '🇲🇩', dial: '373', digits: 8, placeholder: '00 000 000' },
  { name: 'Monaco', flag: '🇲🇨', dial: '377', digits: 8, placeholder: '00 000 000' },
  { name: 'Mongolia', flag: '🇲🇳', dial: '976', digits: 8, placeholder: '00 000 000' },
  { name: 'Montenegro', flag: '🇲🇪', dial: '382', digits: 8, placeholder: '00 000 000' },
  { name: 'Morocco', flag: '🇲🇦', dial: '212', digits: 9, placeholder: '00 000 0000' },
  { name: 'Mozambique', flag: '🇲🇿', dial: '258', digits: 9, placeholder: '00 000 0000' },
  { name: 'Myanmar', flag: '🇲🇲', dial: '95', digits: 8, placeholder: '00 000 000' },
  { name: 'Namibia', flag: '🇳🇦', dial: '264', digits: 9, placeholder: '00 000 0000' },
  { name: 'Nauru', flag: '🇳🇷', dial: '674', digits: 7, placeholder: '000 0000' },
  { name: 'Nepal', flag: '🇳🇵', dial: '977', digits: 10, placeholder: '000 000 0000' },
  { name: 'Netherlands', flag: '🇳🇱', dial: '31', digits: 9, placeholder: '00 000 0000' },
  { name: 'New Zealand', flag: '🇳🇿', dial: '64', digits: 9, placeholder: '00 000 0000' },
  { name: 'Nicaragua', flag: '🇳🇮', dial: '505', digits: 8, placeholder: '00 000 000' },
  { name: 'Niger', flag: '🇳🇪', dial: '227', digits: 8, placeholder: '00 000 000' },
  { name: 'Nigeria', flag: '🇳🇬', dial: '234', digits: 10, placeholder: '000 000 0000' },
  { name: 'North Korea', flag: '🇰🇵', dial: '850', digits: 10, placeholder: '000 000 0000' },
  { name: 'North Macedonia', flag: '🇲🇰', dial: '389', digits: 8, placeholder: '00 000 000' },
  { name: 'Norway', flag: '🇳🇴', dial: '47', digits: 8, placeholder: '00 000 000' },
  { name: 'Oman', flag: '🇴🇲', dial: '968', digits: 8, placeholder: '00 000 000' },
  { name: 'Pakistan', flag: '🇵🇰', dial: '92', digits: 10, placeholder: '000 000 0000' },
  { name: 'Palau', flag: '🇵🇼', dial: '680', digits: 7, placeholder: '000 0000' },
  { name: 'Palestine', flag: '🇵🇸', dial: '970', digits: 9, placeholder: '00 000 0000' },
  { name: 'Panama', flag: '🇵🇦', dial: '507', digits: 8, placeholder: '00 000 000' },
  { name: 'Papua New Guinea', flag: '🇵🇬', dial: '675', digits: 8, placeholder: '00 000 000' },
  { name: 'Paraguay', flag: '🇵🇾', dial: '595', digits: 9, placeholder: '00 000 0000' },
  { name: 'Peru', flag: '🇵🇪', dial: '51', digits: 9, placeholder: '00 000 0000' },
  { name: 'Philippines', flag: '🇵🇭', dial: '63', digits: 10, placeholder: '000 000 0000' },
  { name: 'Poland', flag: '🇵🇱', dial: '48', digits: 9, placeholder: '00 000 0000' },
  { name: 'Portugal', flag: '🇵🇹', dial: '351', digits: 9, placeholder: '00 000 0000' },
  { name: 'Qatar', flag: '🇶🇦', dial: '974', digits: 8, placeholder: '00 000 000' },
  { name: 'Romania', flag: '🇷🇴', dial: '40', digits: 9, placeholder: '00 000 0000' },
  { name: 'Russia', flag: '🇷🇺', dial: '7', digits: 10, placeholder: '000 000 0000' },
  { name: 'Rwanda', flag: '🇷🇼', dial: '250', digits: 9, placeholder: '00 000 0000' },
  { name: 'Saint Kitts and Nevis', flag: '🇰🇳', dial: '1869', digits: 7, placeholder: '000 0000' },
  { name: 'Saint Lucia', flag: '🇱🇨', dial: '1758', digits: 7, placeholder: '000 0000' },
  { name: 'Saint Vincent and the Grenadines', flag: '🇻🇨', dial: '1784', digits: 7, placeholder: '000 0000' },
  { name: 'Samoa', flag: '🇼🇸', dial: '685', digits: 7, placeholder: '000 0000' },
  { name: 'San Marino', flag: '🇸🇲', dial: '378', digits: 10, placeholder: '000 000 0000' },
  { name: 'Sao Tome and Principe', flag: '🇸🇹', dial: '239', digits: 7, placeholder: '000 0000' },
  { name: 'Saudi Arabia', flag: '🇸🇦', dial: '966', digits: 9, placeholder: '00 000 0000' },
  { name: 'Senegal', flag: '🇸🇳', dial: '221', digits: 9, placeholder: '00 000 0000' },
  { name: 'Serbia', flag: '🇷🇸', dial: '381', digits: 9, placeholder: '00 000 0000' },
  { name: 'Seychelles', flag: '🇸🇨', dial: '248', digits: 7, placeholder: '000 0000' },
  { name: 'Sierra Leone', flag: '🇸🇱', dial: '232', digits: 8, placeholder: '00 000 000' },
  { name: 'Singapore', flag: '🇸🇬', dial: '65', digits: 8, placeholder: '00 000 000' },
  { name: 'Slovakia', flag: '🇸🇰', dial: '421', digits: 9, placeholder: '00 000 0000' },
  { name: 'Slovenia', flag: '🇸🇮', dial: '386', digits: 8, placeholder: '00 000 000' },
  { name: 'Solomon Islands', flag: '🇸🇧', dial: '677', digits: 7, placeholder: '000 0000' },
  { name: 'Somalia', flag: '🇸🇴', dial: '252', digits: 8, placeholder: '00 000 000' },
  { name: 'South Africa', flag: '🇿🇦', dial: '27', digits: 9, placeholder: '00 000 0000' },
  { name: 'South Korea', flag: '🇰🇷', dial: '82', digits: 10, placeholder: '000 000 0000' },
  { name: 'South Sudan', flag: '🇸🇸', dial: '211', digits: 9, placeholder: '00 000 0000' },
  { name: 'Spain', flag: '🇪🇸', dial: '34', digits: 9, placeholder: '00 000 0000' },
  { name: 'Sri Lanka', flag: '🇱🇰', dial: '94', digits: 9, placeholder: '00 000 0000' },
  { name: 'Sudan', flag: '🇸🇩', dial: '249', digits: 9, placeholder: '00 000 0000' },
  { name: 'Suriname', flag: '🇸🇷', dial: '597', digits: 7, placeholder: '000 0000' },
  { name: 'Sweden', flag: '🇸🇪', dial: '46', digits: 9, placeholder: '00 000 0000' },
  { name: 'Switzerland', flag: '🇨🇭', dial: '41', digits: 9, placeholder: '00 000 0000' },
  { name: 'Syria', flag: '🇸🇾', dial: '963', digits: 9, placeholder: '00 000 0000' },
  { name: 'Taiwan', flag: '🇹🇼', dial: '886', digits: 9, placeholder: '00 000 0000' },
  { name: 'Tajikistan', flag: '🇹🇯', dial: '992', digits: 9, placeholder: '00 000 0000' },
  { name: 'Tanzania', flag: '🇹🇿', dial: '255', digits: 9, placeholder: '00 000 0000' },
  { name: 'Thailand', flag: '🇹🇭', dial: '66', digits: 9, placeholder: '00 000 0000' },
  { name: 'Timor-Leste', flag: '🇹🇱', dial: '670', digits: 8, placeholder: '00 000 000' },
  { name: 'Togo', flag: '🇹🇬', dial: '228', digits: 8, placeholder: '00 000 000' },
  { name: 'Tonga', flag: '🇹🇴', dial: '676', digits: 7, placeholder: '000 0000' },
  { name: 'Trinidad and Tobago', flag: '🇹🇹', dial: '1868', digits: 7, placeholder: '000 0000' },
  { name: 'Tunisia', flag: '🇹🇳', dial: '216', digits: 8, placeholder: '00 000 000' },
  { name: 'Turkey', flag: '🇹🇷', dial: '90', digits: 10, placeholder: '000 000 0000' },
  { name: 'Turkmenistan', flag: '🇹🇲', dial: '993', digits: 8, placeholder: '00 000 000' },
  { name: 'Tuvalu', flag: '🇹🇻', dial: '688', digits: 6, placeholder: '000000' },
  { name: 'Uganda', flag: '🇺🇬', dial: '256', digits: 9, placeholder: '00 000 0000' },
  { name: 'Ukraine', flag: '🇺🇦', dial: '380', digits: 9, placeholder: '00 000 0000' },
  { name: 'United Arab Emirates', flag: '🇦🇪', dial: '971', digits: 9, placeholder: '00 000 0000' },
  { name: 'United Kingdom', flag: '🇬🇧', dial: '44', digits: 10, placeholder: '000 000 0000' },
  { name: 'United States', flag: '🇺🇸', dial: '1', digits: 10, placeholder: '000 000 0000' },
  { name: 'Uruguay', flag: '🇺🇾', dial: '598', digits: 8, placeholder: '00 000 000' },
  { name: 'Uzbekistan', flag: '🇺🇿', dial: '998', digits: 9, placeholder: '00 000 0000' },
  { name: 'Vanuatu', flag: '🇻🇺', dial: '678', digits: 7, placeholder: '000 0000' },
  { name: 'Vatican City', flag: '🇻🇦', dial: '379', digits: 10, placeholder: '000 000 0000' },
  { name: 'Venezuela', flag: '🇻🇪', dial: '58', digits: 10, placeholder: '000 000 0000' },
  { name: 'Vietnam', flag: '🇻🇳', dial: '84', digits: 9, placeholder: '00 000 0000' },
  { name: 'Yemen', flag: '🇾🇪', dial: '967', digits: 9, placeholder: '00 000 0000' },
  { name: 'Zambia', flag: '🇿🇲', dial: '260', digits: 9, placeholder: '00 000 0000' },
  { name: 'Zimbabwe', flag: '🇿🇼', dial: '263', digits: 9, placeholder: '00 000 0000' },
];
const DEFAULT_PHONE_COUNTRY = WORLD_COUNTRIES.find((c) => c.name === 'Sri Lanka');

// Common abbreviations/alternate names people actually type, mapped to the
// exact WORLD_COUNTRIES entry so "UAE", "USA", "UK" etc. still resolve.
const COUNTRY_ALIASES = {
  uae: 'United Arab Emirates',
  'u.a.e': 'United Arab Emirates',
  usa: 'United States',
  us: 'United States',
  'u.s.a': 'United States',
  america: 'United States',
  uk: 'United Kingdom',
  'u.k': 'United Kingdom',
  britain: 'United Kingdom',
  'great britain': 'United Kingdom',
  drc: 'Congo (DRC)',
  congo: 'Congo (DRC)',
  'democratic republic of congo': 'Congo (DRC)',
  'republic of congo': 'Congo (Republic)',
  'ivory coast': 'Ivory Coast',
  "cote d'ivoire": 'Ivory Coast',
  'cote divoire': 'Ivory Coast',
  czechia: 'Czech Republic',
  korea: 'South Korea',
  'south korea': 'South Korea',
  'north korea': 'North Korea',
  burma: 'Myanmar',
  swaziland: 'Eswatini',
  macedonia: 'North Macedonia',
  'cabo verde': 'Cape Verde',
  'east timor': 'Timor-Leste',
  vatican: 'Vatican City',
  holland: 'Netherlands',
  ksa: 'Saudi Arabia',
  ph: 'Philippines',
};

function countryMatchesQuery(country, query) {
  if (country.name.toLowerCase().includes(query)) return true;
  return Object.entries(COUNTRY_ALIASES).some(
    ([alias, name]) => name === country.name && alias.includes(query)
  );
}

function resolveCountryAlias(typed) {
  const key = typed.toLowerCase().trim();
  const mappedName = COUNTRY_ALIASES[key];
  if (!mappedName) return null;
  return WORLD_COUNTRIES.find((c) => c.name === mappedName) || null;
}

function buildIntlPhoneField(targetInput) {
  targetInput.type = 'hidden';

  const wrap = document.createElement('div');
  wrap.className = 'intl-phone-field';

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'intl-phone-trigger';
  trigger.setAttribute('aria-haspopup', 'listbox');
  trigger.setAttribute('aria-expanded', 'false');
  trigger.innerHTML = `
    <span class="intl-phone-flag">${DEFAULT_PHONE_COUNTRY.flag}</span>
    <span class="intl-phone-dial">+${DEFAULT_PHONE_COUNTRY.dial}</span>
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9" /></svg>
  `;

  const dropdown = document.createElement('div');
  dropdown.className = 'intl-phone-dropdown';
  dropdown.hidden = true;
  dropdown.innerHTML = `
    <input type="text" class="intl-phone-search" placeholder="Search country or code..." autocomplete="off" />
    <ul class="intl-phone-list" role="listbox"></ul>
  `;

  const numberInput = document.createElement('input');
  numberInput.type = 'tel';
  numberInput.inputMode = 'numeric';
  numberInput.autocomplete = 'tel-national';
  numberInput.className = targetInput.getAttribute('data-visible-class') || 'hero-text-input';
  numberInput.placeholder = DEFAULT_PHONE_COUNTRY.placeholder;
  numberInput.maxLength = DEFAULT_PHONE_COUNTRY.digits;
  if (targetInput.hasAttribute('required')) numberInput.required = true;

  wrap.appendChild(trigger);
  wrap.appendChild(dropdown);
  wrap.appendChild(numberInput);
  targetInput.insertAdjacentElement('beforebegin', wrap);

  const searchInput = dropdown.querySelector('.intl-phone-search');
  const listEl = dropdown.querySelector('.intl-phone-list');
  let currentCountry = DEFAULT_PHONE_COUNTRY;

  function syncHiddenValue() {
    const digits = numberInput.value.replace(/\D/g, '');
    targetInput.value = digits ? `+${currentCountry.dial}${digits}` : '';
  }

  function renderList(filterText) {
    const q = (filterText || '').trim().toLowerCase();
    const matches = WORLD_COUNTRIES.filter((c) =>
      !q || countryMatchesQuery(c, q) || c.dial.includes(q.replace('+', ''))
    );
    listEl.innerHTML = matches
      .map(
        (c) => `
        <li role="option" class="intl-phone-option" data-dial="${c.dial}">
          <span class="intl-phone-flag">${c.flag}</span>
          <span class="intl-phone-option-name">${c.name}</span>
          <span class="intl-phone-option-dial">+${c.dial}</span>
        </li>`
      )
      .join('') || '<li class="intl-phone-no-results">No countries match</li>';
  }

  function selectCountry(country) {
    currentCountry = country;
    trigger.querySelector('.intl-phone-flag').textContent = country.flag;
    trigger.querySelector('.intl-phone-dial').textContent = `+${country.dial}`;
    numberInput.placeholder = country.placeholder;
    numberInput.maxLength = country.digits;
    numberInput.value = numberInput.value.replace(/\D/g, '').slice(0, country.digits);
    syncHiddenValue();
  }

  function openDropdown() {
    dropdown.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    renderList('');
    searchInput.value = '';
    searchInput.focus();
  }

  function closeDropdown() {
    dropdown.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
  }

  trigger.addEventListener('click', () => {
    if (dropdown.hidden) openDropdown();
    else closeDropdown();
  });

  searchInput.addEventListener('input', () => renderList(searchInput.value));

  listEl.addEventListener('click', (e) => {
    const item = e.target.closest('.intl-phone-option');
    if (!item) return;
    const country = WORLD_COUNTRIES.find((c) => c.dial === item.getAttribute('data-dial'));
    if (country) selectCountry(country);
    closeDropdown();
    numberInput.focus();
  });

  document.addEventListener('click', (e) => {
    if (!wrap.contains(e.target)) closeDropdown();
  });

  wrap.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeDropdown();
      numberInput.focus();
    }
  });

  numberInput.addEventListener('input', () => {
    numberInput.value = numberInput.value.replace(/\D/g, '').slice(0, currentCountry.digits);
    syncHiddenValue();
  });
}

function initIntlPhoneFields() {
  document.querySelectorAll('[data-intl-phone]').forEach(buildIntlPhoneField);
}

/* ==========================================================================
   0c. COUNTRY AUTOCOMPLETE (destination country, etc.)
   Wraps a plain text input with a type-to-filter suggestion list drawn from
   the same WORLD_COUNTRIES data, so what ends up in the field is always a
   real country name rather than free-typed text. The input keeps its
   original id/name — only a dropdown list is added alongside it.
   ========================================================================== */
function buildCountryAutocomplete(input) {
  const wrap = document.createElement('div');
  wrap.className = 'country-autocomplete-wrap';
  input.insertAdjacentElement('beforebegin', wrap);
  wrap.appendChild(input);

  const list = document.createElement('ul');
  list.className = 'country-autocomplete-list';
  list.hidden = true;
  wrap.appendChild(list);

  input.autocomplete = 'off';

  function renderList(filterText) {
    const q = filterText.trim().toLowerCase();
    if (!q) {
      list.hidden = true;
      list.innerHTML = '';
      return;
    }
    const matches = WORLD_COUNTRIES.filter((c) => countryMatchesQuery(c, q)).slice(0, 8);
    if (!matches.length) {
      list.innerHTML = '<li class="country-autocomplete-empty">No matching country</li>';
      list.hidden = false;
      return;
    }
    list.innerHTML = matches
      .map((c) => `<li class="country-autocomplete-option" data-name="${c.name}"><span class="intl-phone-flag">${c.flag}</span><span>${c.name}</span></li>`)
      .join('');
    list.hidden = false;
  }

  input.addEventListener('input', () => {
    input.setCustomValidity('');
    renderList(input.value);
  });

  input.addEventListener('focus', () => {
    if (input.value) renderList(input.value);
  });

  list.addEventListener('mousedown', (e) => {
    const item = e.target.closest('.country-autocomplete-option');
    if (!item) return;
    input.value = item.getAttribute('data-name');
    input.setCustomValidity('');
    list.hidden = true;
  });

  input.addEventListener('blur', () => {
    setTimeout(() => {
      list.hidden = true;
      const typed = input.value.trim();
      if (!typed) return;
      const exact = WORLD_COUNTRIES.find((c) => c.name.toLowerCase() === typed.toLowerCase());
      if (exact) {
        input.value = exact.name;
        return;
      }
      const aliased = resolveCountryAlias(typed);
      if (aliased) {
        input.value = aliased.name;
        return;
      }
      const partial = WORLD_COUNTRIES.filter((c) => countryMatchesQuery(c, typed.toLowerCase()));
      if (partial.length === 1) {
        input.value = partial[0].name;
      } else {
        input.setCustomValidity('Please select a valid country from the list.');
        input.reportValidity();
      }
    }, 150);
  });
}

function initCountryAutocompleteFields() {
  document.querySelectorAll('[data-country-autocomplete]').forEach(buildCountryAutocomplete);
}

/* ==========================================================================
   1. NAVBAR & MOBILE DRAWER
   ========================================================================== */
/* The mobile drawer opens from the left and pushes the rest of the page to
   the right (rather than overlaying on top of it), so the header/logo stays
   visible beside it. That means everything else on the page needs to live
   inside one "shell" element that can be transformed, while the drawer and
   backdrop stay direct children of <body> — transforming an ancestor turns
   it into the containing block for any position:fixed element still nested
   inside it, which would otherwise drag the drawer/backdrop (and floating
   widgets like the WhatsApp button) along with the push. Most pages already
   wrap everything in a `.page-wrapper` div we can reuse as that shell; pages
   without one get a synthetic wrapper created here instead. Zero per-page
   HTML edits either way. */
function setupPushDrawerShell(drawer, backdrop) {
  if (!drawer || !backdrop || document.getElementById('page-push-shell')) return;

  const keepOutOfShell = [drawer, backdrop, ...document.querySelectorAll('.whatsapp-float-btn, .cookie-consent-banner')];
  keepOutOfShell.forEach((el) => document.body.appendChild(el));

  let shell = document.querySelector('.page-wrapper');
  if (!shell) {
    shell = document.createElement('div');
    document.body.insertBefore(shell, document.body.firstChild);
  }

  Array.from(document.body.children).forEach((el) => {
    if (el === shell || keepOutOfShell.includes(el)) return;
    shell.appendChild(el);
  });

  shell.id = 'page-push-shell';
}

function initNavbar() {
  const header = document.querySelector('.uthao-navbar');
  const hamburger = document.querySelector('.nav-hamburger-btn');
  const drawer = document.querySelector('.mobile-menu-drawer');
  const backdrop = document.querySelector('.mobile-menu-backdrop');
  const closeBtn = document.querySelector('.mobile-menu-close');

  setupPushDrawerShell(drawer, backdrop);

  // Highlight the current page in both the desktop and mobile nav
  const currentFile = window.location.pathname.split('/').pop() || 'index.html';
  const currentPage = currentFile.replace('.html', '') || 'index';
  document.querySelectorAll('[data-navpage]').forEach((link) => {
    if (link.dataset.navpage === currentPage) {
      link.classList.add('active');
    }
  });

  if (header) {
    // Solidify the nav only once the page has scrolled past the hero
    // section itself — not after a small fixed offset — so it never turns
    // solid while a dark hero photo is still visible behind it.
    const heroEl = document.querySelector(
      '.service-hero, .ocean-hero-section, .air-hero-section, .container-hero-section, .rail-hero-section, .delivery-hero-section, .about-hero-section, .career-hero-section, .career-detail-hero, .notfound-hero-section'
    );
    const getThreshold = () => (heroEl ? heroEl.getBoundingClientRect().height - 40 : 30);

    // Hide the nav on scroll-down, reveal it on scroll-up — so it never sits
    // on screen next to the footer's own logo when the user reaches the bottom.
    // A small upward-scroll requirement (rather than any single upward tick)
    // keeps momentum-scroll "settle" bounces from flashing the nav back in.
    // The footer itself is also an explicit hard override below, since a
    // deliberate (not just a tiny bounce) scroll-up while the footer is
    // already in view must still never show both logos at once.
    const footerEl = document.querySelector('.uthao-footer');
    let lastScrollY = window.scrollY;
    let upwardAccum = 0;
    const REVEAL_THRESHOLD = 60;

    const handleScroll = () => {
      const currentY = window.scrollY;
      const delta = currentY - lastScrollY;

      if (currentY > getThreshold()) {
        header.classList.add('is-scrolled');
      } else {
        header.classList.remove('is-scrolled');
      }

      const footerInView = footerEl && footerEl.getBoundingClientRect().top < window.innerHeight;
      const drawerOpen = drawer && drawer.classList.contains('active');
      if (footerInView) {
        header.classList.add('nav-hidden');
      } else if (!drawerOpen) {
        if (delta > 0) {
          upwardAccum = 0;
          if (currentY > 160) header.classList.add('nav-hidden');
        } else if (delta < 0) {
          upwardAccum += -delta;
          if (currentY <= 160 || upwardAccum > REVEAL_THRESHOLD) {
            header.classList.remove('nav-hidden');
          }
        }
      }
      lastScrollY = currentY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    handleScroll();
  }

  function openDrawer() {
    if (drawer && backdrop && hamburger) {
      drawer.classList.add('active');
      backdrop.classList.add('active');
      document.body.classList.add('mobile-menu-open');
      hamburger.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeDrawer() {
    if (drawer && backdrop && hamburger) {
      drawer.classList.remove('active');
      backdrop.classList.remove('active');
      document.body.classList.remove('mobile-menu-open');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
  }

  if (hamburger) {
    hamburger.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = drawer && drawer.classList.contains('active');
      if (isOpen) {
        closeDrawer();
      } else {
        openDrawer();
      }
    });
  }

  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
  if (backdrop) backdrop.addEventListener('click', closeDrawer);

  document.querySelectorAll('.mobile-nav-link, .mobile-nav-sublink').forEach((link) => {
    link.addEventListener('click', closeDrawer);
  });

  initMobileNavAccordion();
}

/* ==========================================================================
   2. HERO INSTANT QUOTE WIZARD (step-by-step, no fake live tracking)
   ========================================================================== */
function initQuoteWizard() {
  const wizard = document.getElementById('hero-quote-wizard');
  if (!wizard) return;

  const steps = Array.from(wizard.querySelectorAll('.wizard-step'));
  const fill = wizard.querySelector('[data-wizard-fill]');
  const stepNumEl = wizard.querySelector('[data-wizard-step-num]');
  const totalRealSteps = 3; // step 4 is the success state, excluded from the progress count

  function goToStep(stepNumber) {
    steps.forEach((s) => {
      s.classList.toggle('active', s.getAttribute('data-wizard-step') === String(stepNumber));
    });
    if (fill) {
      const pct = Math.min(stepNumber, totalRealSteps) / totalRealSteps * 100;
      fill.style.width = `${pct}%`;
    }
    if (stepNumEl && stepNumber <= totalRealSteps) {
      stepNumEl.textContent = String(stepNumber);
    }
  }

  function validateStep(stepEl) {
    const fields = Array.from(stepEl.querySelectorAll('input[required], select[required], textarea[required]'));
    const invalid = fields.find((f) => !f.checkValidity());
    if (invalid) {
      invalid.reportValidity();
      invalid.focus();
      return false;
    }
    return true;
  }

  wizard.querySelectorAll('[data-wizard-next]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const current = btn.closest('.wizard-step');
      if (!validateStep(current)) return;
      const currentNum = parseInt(current.getAttribute('data-wizard-step'), 10);
      goToStep(currentNum + 1);
    });
  });

  wizard.querySelectorAll('[data-wizard-back]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const current = btn.closest('.wizard-step');
      const currentNum = parseInt(current.getAttribute('data-wizard-step'), 10);
      goToStep(currentNum - 1);
    });
  });

  // Shipment-type chip selector (step 1)
  wizard.querySelectorAll('.wizard-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      wizard.querySelectorAll('.wizard-chip').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
    });
  });

  wizard.addEventListener('submit', (e) => {
    e.preventDefault();
    const step3 = wizard.querySelector('.wizard-step[data-wizard-step="3"]');
    if (!validateStep(step3)) return;

    const emailInput = document.getElementById('wizard-email');
    const successEmailEl = wizard.querySelector('[data-wizard-success-email]');
    if (successEmailEl) {
      successEmailEl.textContent = (emailInput && emailInput.value.trim()) || 'your email';
    }

    const activeChip = wizard.querySelector('.wizard-chip.active');
    const submitBtn = wizard.querySelector('#wizard-submit-btn, [type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    submitFormData({
      form_name: 'Instant Quote Wizard',
      shipment_type: activeChip ? activeChip.dataset.mode : '',
      destination: (document.getElementById('wizard-destination') || {}).value || '',
      weight_kg: (document.getElementById('wizard-weight') || {}).value || '',
      volume_cbm: (document.getElementById('wizard-volume') || {}).value || '',
      cargo_description: (document.getElementById('wizard-cargo-desc') || {}).value || '',
      name: (document.getElementById('wizard-name') || {}).value || '',
      email: (emailInput && emailInput.value) || '',
      phone: (document.getElementById('wizard-phone') || {}).value || '',
    }, 'New Instant Quote Request - Neptune Website').finally(() => {
      if (submitBtn) submitBtn.disabled = false;
      goToStep(4);
    });
  });
}

/* ==========================================================================
   3. CONTAINER LINE COLOR-SWITCHER SHOWCASE
   Allows user to cycle through real container shipping lines (Maersk,
   Evergreen, MSC, Hapag-Lloyd, CMA CGM, ONE, Neptune), dynamically updating
   section background tint, specifications, and container photo.
   ========================================================================== */
const CARRIER_DATA = {
  maersk: {
    key: 'maersk',
    name: 'Maersk Line',
    color: '#0082f3',
    glow: 'rgba(0, 130, 243, 0.35)',
    bg: '#f0f7ff',
    hq: 'Copenhagen, Denmark',
    image: 'assets/images/carrier-maersk.jpg',
    features: 'Global vessel sharing agreement, direct Colombo-Europe calls',
    tag: 'World Largest Carrier Network',
    destCity: 'Rotterdam, Netherlands',
    lane: 'LKCMB &rarr; NLRTM',
    days: '18&ndash;22 Days',
    hubLeg: 'Transshipment via Singapore',
    arrivalLeg: 'Arrives Rotterdam, Netherlands'
  },
  evergreen: {
    key: 'evergreen',
    name: 'Evergreen Marine Corp',
    color: '#00843d',
    glow: 'rgba(0, 132, 61, 0.35)',
    bg: '#f0fbf4',
    hq: 'Taoyuan, Taiwan',
    image: 'assets/images/carrier-evergreen.jpg',
    features: 'Dedicated Far East & Trans-Pacific express services via Colombo CICT',
    tag: 'Transpacific & Asia Specialist',
    destCity: 'Singapore',
    lane: 'LKCMB &rarr; SGSIN',
    days: '4&ndash;5 Days',
    hubLeg: 'Direct mainline call, no transshipment',
    arrivalLeg: 'Arrives Singapore (SGSIN)'
  },
  msc: {
    key: 'msc',
    name: 'Mediterranean Shipping Company (MSC)',
    color: '#003399',
    glow: 'rgba(0, 51, 153, 0.35)',
    bg: '#f0f3ff',
    hq: 'Geneva, Switzerland',
    image: 'assets/images/carrier-msc.jpg',
    features: 'World\'s largest container fleet with weekly Colombo-Mediterranean strings',
    tag: 'Largest Global Fleet Capacity',
    destCity: 'Jeddah, Saudi Arabia',
    lane: 'LKCMB &rarr; SAJED',
    days: '8&ndash;11 Days',
    hubLeg: 'Direct mainline call, no transshipment',
    arrivalLeg: 'Arrives Jeddah, Saudi Arabia'
  },
  hapaglloyd: {
    key: 'hapaglloyd',
    name: 'Hapag-Lloyd AG',
    color: '#e65100',
    glow: 'rgba(230, 81, 0, 0.35)',
    bg: '#fff8f0',
    hq: 'Hamburg, Germany',
    image: 'assets/images/carrier-hapaglloyd.jpg',
    features: 'Specialized reefer & dangerous goods compliance via Colombo SAGT',
    tag: 'European Quality & Reefer Leader',
    destCity: 'Hamburg, Germany',
    lane: 'LKCMB &rarr; DEHAM',
    days: '19&ndash;23 Days',
    hubLeg: 'Transshipment via Jebel Ali',
    arrivalLeg: 'Arrives Hamburg, Germany'
  },
  one: {
    key: 'one',
    name: 'Ocean Network Express (ONE)',
    color: '#d80064',
    glow: 'rgba(216, 0, 100, 0.35)',
    bg: '#fdf0f7',
    hq: 'Singapore / Tokyo',
    image: 'assets/images/carrier-one.jpg',
    features: 'Intra-Asia, South Asia, and North American express strings',
    tag: 'Japanese Triple Consortium',
    destCity: 'Singapore',
    lane: 'LKCMB &rarr; SGSIN',
    days: '4&ndash;5 Days',
    hubLeg: 'Direct mainline call, no transshipment',
    arrivalLeg: 'Arrives Singapore (SGSIN)'
  },
  cmacgm: {
    key: 'cmacgm',
    name: 'CMA CGM Group',
    color: '#0a2a6b',
    glow: 'rgba(10, 42, 107, 0.35)',
    bg: '#f0f3fa',
    hq: 'Marseille, France',
    image: 'assets/images/carrier-cma-cgm.jpg',
    features: 'French global carrier with direct Colombo-Mediterranean-Europe strings',
    tag: 'French Global Alliance Member',
    destCity: 'Fos-sur-Mer, France',
    lane: 'LKCMB &rarr; FRFOS',
    days: '20&ndash;24 Days',
    hubLeg: 'Transshipment via Jeddah',
    arrivalLeg: 'Arrives Fos-sur-Mer, France'
  },
  cosco: {
    key: 'cosco',
    name: 'COSCO Shipping',
    color: '#c8102e',
    glow: 'rgba(200, 16, 46, 0.35)',
    bg: '#fdf1f2',
    hq: 'Shanghai, China',
    image: 'assets/images/carrier-cosco.jpg',
    features: 'High-frequency China-South Asia services with priority Colombo transshipment',
    tag: 'China Ocean Shipping Giant',
    destCity: 'Shanghai, China',
    lane: 'LKCMB &rarr; CNSHA',
    days: '9&ndash;12 Days',
    hubLeg: 'Direct mainline call, no transshipment',
    arrivalLeg: 'Arrives Shanghai, China'
  },
  wanhai: {
    key: 'wanhai',
    name: 'Wan Hai Lines',
    color: '#d21f3c',
    glow: 'rgba(210, 31, 60, 0.35)',
    bg: '#fdf1f3',
    hq: 'Taipei, Taiwan',
    image: 'assets/images/carrier-wan-hai.jpg',
    features: 'Dense intra-Asia network connecting Colombo to Southeast Asian feeder ports',
    tag: 'Intra-Asia Feeder Network',
    destCity: 'Hai Phong, Vietnam',
    lane: 'LKCMB &rarr; VNHPH',
    days: '7&ndash;9 Days',
    hubLeg: 'Transshipment via Port Klang',
    arrivalLeg: 'Arrives Hai Phong, Vietnam'
  }
};

function initContainerShowcase() {
  const showcaseSection = document.querySelector('.container-showcase-section');
  if (!showcaseSection) return;

  const carrierKeys = Object.keys(CARRIER_DATA);
  let currentIndex = 0;

  const imgDisplay = document.getElementById('container-display-img');
  const carrierNameEl = document.getElementById('carrier-title-name');
  const carrierTagEl = document.getElementById('carrier-tag-badge');
  const carrierFeaturesEl = document.getElementById('carrier-spec-features');
  const routeDestEl = document.getElementById('carrier-route-dest');
  const routeLaneEl = document.getElementById('carrier-route-lane');
  const routeDaysEl = document.getElementById('carrier-route-days');
  const transshipEl = document.getElementById('carrier-transship-hub');
  const arrivalEl = document.getElementById('carrier-arrival-line');
  const counterCurrentEl = document.getElementById('carrier-current-index');
  const counterTotalEl = document.getElementById('carrier-total-count');

  const prevBtn = document.getElementById('container-prev-btn');
  const nextBtn = document.getElementById('container-next-btn');
  const pills = document.querySelectorAll('.carrier-pill');

  if (counterTotalEl) {
    counterTotalEl.textContent = String(carrierKeys.length).padStart(2, '0');
  }

  function applyCarrier(key, direction = 'next') {
    const data = CARRIER_DATA[key];
    if (!data) return;

    currentIndex = carrierKeys.indexOf(key);

    // Update section attributes & styles
    showcaseSection.setAttribute('data-carrier', key);
    showcaseSection.style.setProperty('--carrier-color', data.color);
    showcaseSection.style.setProperty('--carrier-glow', data.glow);

    // Update pills active state
    pills.forEach((p) => {
      const pKey = p.getAttribute('data-carrier');
      if (pKey === key) {
        p.classList.add('active');
      } else {
        p.classList.remove('active');
      }
    });

    // Animate image transition
    if (imgDisplay) {
      imgDisplay.style.opacity = '0';
      imgDisplay.style.transform = direction === 'next' ? 'translateX(60px) scale(0.88)' : 'translateX(-60px) scale(0.88)';

      setTimeout(() => {
        imgDisplay.src = data.image;
        imgDisplay.alt = `${data.name} container`;
        imgDisplay.style.transform = direction === 'next' ? 'translateX(-60px) scale(0.88)' : 'translateX(60px) scale(0.88)';

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            imgDisplay.style.opacity = '1';
            imgDisplay.style.transform = 'translateX(0) scale(1)';
          });
        });
      }, 200);
    }

    // Update textual data
    if (carrierNameEl) carrierNameEl.textContent = data.name;
    if (carrierTagEl) carrierTagEl.textContent = data.tag;
    if (carrierFeaturesEl) carrierFeaturesEl.textContent = data.features;
    if (routeDestEl) routeDestEl.textContent = data.destCity;
    if (routeLaneEl) routeLaneEl.innerHTML = data.lane;
    if (routeDaysEl) routeDaysEl.innerHTML = data.days;
    if (transshipEl) transshipEl.textContent = data.hubLeg;
    if (arrivalEl) arrivalEl.textContent = data.arrivalLeg;
    if (counterCurrentEl) counterCurrentEl.textContent = String(currentIndex + 1).padStart(2, '0');
  }

  // Pill click listeners
  pills.forEach((pill) => {
    pill.addEventListener('click', () => {
      const targetCarrier = pill.getAttribute('data-carrier');
      const targetIndex = carrierKeys.indexOf(targetCarrier);
      const direction = targetIndex >= currentIndex ? 'next' : 'prev';
      applyCarrier(targetCarrier, direction);
    });
  });

  // Navigation Arrow listeners
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      currentIndex = (currentIndex - 1 + carrierKeys.length) % carrierKeys.length;
      applyCarrier(carrierKeys[currentIndex], 'prev');
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      currentIndex = (currentIndex + 1) % carrierKeys.length;
      applyCarrier(carrierKeys[currentIndex], 'next');
    });
  }

  // Touch / swipe support on mobile container display
  const stageWrap = document.querySelector('.container-display-box');
  if (stageWrap) {
    let startX = 0;
    stageWrap.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
    }, { passive: true });

    stageWrap.addEventListener('touchend', (e) => {
      const endX = e.changedTouches[0].clientX;
      const diffX = endX - startX;
      if (Math.abs(diffX) > 40) {
        if (diffX < 0) {
          currentIndex = (currentIndex + 1) % carrierKeys.length;
          applyCarrier(carrierKeys[currentIndex], 'next');
        } else {
          currentIndex = (currentIndex - 1 + carrierKeys.length) % carrierKeys.length;
          applyCarrier(carrierKeys[currentIndex], 'prev');
        }
      }
    }, { passive: true });
  }

  // Initialize with default carrier (maersk)
  applyCarrier('maersk');
}

/* ==========================================================================
   4. INTERACTIVE WORLD MAP (DOT MATRIX + GLOWING ROUTE NODES)
   Renders over mapbase.svg. Hovering or moving cursor makes nodes glow and
   shows trade lanes, transit times, and confidential logistics data.
   ========================================================================== */
function initWorldMapInteractions() {
  const mapContainer = document.querySelector('.map-container-relative');
  const nodes = document.querySelectorAll('.map-node');
  if (!mapContainer || !nodes.length) return;

  // Subtle proximity radar effect: glow nearest dot when hovering map
  mapContainer.addEventListener('mousemove', (e) => {
    const rect = mapContainer.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    let closestNode = null;
    let minDistance = 90; // Proximity threshold in pixels

    nodes.forEach((node) => {
      const nodeLeft = (parseFloat(node.style.left) / 100) * rect.width;
      const nodeTop = (parseFloat(node.style.top) / 100) * rect.height;
      const dist = Math.hypot(mouseX - nodeLeft, mouseY - nodeTop);

      if (dist < minDistance) {
        minDistance = dist;
        closestNode = node;
      }
    });

    nodes.forEach((node) => {
      if (node === closestNode) {
        node.classList.add('proximity-active');
      } else {
        node.classList.remove('proximity-active');
      }
    });
  });

  mapContainer.addEventListener('mouseleave', () => {
    nodes.forEach((node) => node.classList.remove('proximity-active'));
  });
}

/* ==========================================================================
   5. FAQ ACCORDION
   ========================================================================== */
function initFaqAccordion() {
  const faqItems = document.querySelectorAll('.faq-item');
  if (!faqItems.length) return;

  faqItems.forEach((item) => {
    const btn = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');

    if (!btn || !answer) return;

    btn.addEventListener('click', () => {
      const isAlreadyOpen = item.classList.contains('open');

      // Close all other items
      faqItems.forEach((other) => {
        if (other !== item && other.classList.contains('open')) {
          other.classList.remove('open');
          const otherBtn = other.querySelector('.faq-question');
          const otherAnswer = other.querySelector('.faq-answer');
          if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
          if (otherAnswer) otherAnswer.style.maxHeight = null;
        }
      });

      // Toggle current item
      if (isAlreadyOpen) {
        item.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
        answer.style.maxHeight = null;
      } else {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
        answer.style.maxHeight = `${answer.scrollHeight + 16}px`;
      }
    });
  });

  // Open initially open items
  const initialOpen = document.querySelector('.faq-item.open .faq-answer');
  if (initialOpen) {
    initialOpen.style.maxHeight = `${initialOpen.scrollHeight + 16}px`;
  }
}

/* ==========================================================================
   6. ROLLING STATISTICS COUNTER
   ========================================================================== */
function initStatsCounter() {
  const counters = document.querySelectorAll('[data-counter]');
  if (!counters.length) return;

  let hasAnimated = false;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !hasAnimated) {
          hasAnimated = true;
          animateCounters(counters);
        }
      });
    },
    { threshold: 0.3 }
  );

  const container = document.querySelector('.stats-counter-strip') || counters[0].parentElement;
  if (container) {
    observer.observe(container);
  }

  function animateCounters(items) {
    items.forEach((counter) => {
      const target = parseFloat(counter.getAttribute('data-target') || '0');
      const suffix = counter.getAttribute('data-suffix') || '';
      const prefix = counter.getAttribute('data-prefix') || '';
      const decimals = parseInt(counter.getAttribute('data-decimals') || '0', 10);
      const duration = parseInt(counter.getAttribute('data-duration') || '1800', 10);

      const startTime = performance.now();

      function update(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Easing out cubic
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const current = target * easeOut;

        const formatted = decimals > 0 ? current.toFixed(decimals) : Math.round(current).toLocaleString();
        counter.textContent = `${prefix}${formatted}${suffix}`;

        if (progress < 1) {
          requestAnimationFrame(update);
        } else {
          const finalFormatted = decimals > 0 ? target.toFixed(decimals) : target.toLocaleString();
          counter.textContent = `${prefix}${finalFormatted}${suffix}`;
        }
      }

      requestAnimationFrame(update);
    });
  }
}


/* ==========================================================================
   8. SHIPMENT ROUTE ANIMATION
   ========================================================================== */
function initShipmentRouteAnimation() {
  const steps = document.querySelectorAll('.tracking-step');
  if (!steps.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          steps.forEach((step, idx) => {
            setTimeout(() => {
              step.classList.add('step-animated');
            }, idx * 250);
          });
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 }
  );

  const tracker = document.querySelector('.tracking-card');
  if (tracker) observer.observe(tracker);
}

/* ==========================================================================
   9. CONTAINER CARGO EQUIPMENT SWITCHER
   ========================================================================== */
function initEquipmentSwitcher() {
  const tabs = document.querySelectorAll('.eq-tab-btn');
  const card = document.querySelector('.eq-spec-card');
  if (!tabs.length || !card) return;

  const EQ_DATA = {
    '20ft': {
      title: "20' Standard Dry Van (20GP)",
      desc: "The universal benchmark for high-density, heavy ocean freight. Extensively deployed for bulk tea exports, rubber, and manufactured parts departing Colombo SAGT & JCT terminals.",
      image: "assets/uthao/container-cargo-1.png",
      length: "5.90 m (19' 4\")",
      width: "2.35 m (7' 8\")",
      height: "2.39 m (7' 10\")",
      capacity: "33.2 m³ (1,172 cu ft)",
      payload: "28,200 kg / 62,170 lbs",
      tare: "2,200 kg / 4,850 lbs"
    },
    '40ft': {
      title: "40' Standard Dry Freight (40GP)",
      desc: "Designed for voluminous consumer goods, apparel consignments, and general commercial trade across Trans-Pacific and Europe-Asia liner corridors.",
      image: "assets/uthao/container-cargo-2.png",
      length: "12.03 m (39' 5\")",
      width: "2.35 m (7' 8\")",
      height: "2.39 m (7' 10\")",
      capacity: "67.7 m³ (2,390 cu ft)",
      payload: "26,780 kg / 59,040 lbs",
      tare: "3,700 kg / 8,157 lbs"
    },
    '40hc': {
      title: "40' High Cube Container (40HC)",
      desc: "Featuring an extra 30 cm (1 foot) in vertical clearance. The prime standard for ready-made garments, hanging apparel, and high-cube commercial freight.",
      image: "assets/uthao/container-cargo-3.png",
      length: "12.03 m (39' 5\")",
      width: "2.35 m (7' 8\")",
      height: "2.70 m (8' 10\")",
      capacity: "76.4 m³ (2,700 cu ft)",
      payload: "28,750 kg / 63,382 lbs",
      tare: "3,750 kg / 8,267 lbs"
    },
    'reefer': {
      title: "40' High Cube Refrigerated (Reefer)",
      desc: "Integrated Thermo King / Carrier Transicold cooling units maintaining micro-temperatures from -30°C to +30°C. Engineered for perishable seafood, pharmaceuticals, and tropical fruit.",
      image: "assets/uthao/container-cargo-4.png",
      length: "11.58 m (38' 0\")",
      width: "2.29 m (7' 6\")",
      height: "2.55 m (8' 4\")",
      capacity: "67.5 m³ (2,385 cu ft)",
      payload: "29,520 kg / 65,080 lbs",
      tare: "4,480 kg / 9,876 lbs"
    }
  };

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const type = tab.getAttribute('data-eq');
      const data = EQ_DATA[type];
      if (!data) return;

      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const img = card.querySelector('.eq-spec-img');
      const title = card.querySelector('.eq-spec-title');
      const desc = card.querySelector('.eq-spec-desc');
      const statLength = card.querySelector('[data-stat="length"]');
      const statWidth = card.querySelector('[data-stat="width"]');
      const statHeight = card.querySelector('[data-stat="height"]');
      const statCap = card.querySelector('[data-stat="capacity"]');
      const statPayload = card.querySelector('[data-stat="payload"]');
      const statTare = card.querySelector('[data-stat="tare"]');

      if (img) img.src = data.image;
      if (title) title.textContent = data.title;
      if (desc) desc.textContent = data.desc;
      if (statLength) statLength.textContent = data.length;
      if (statWidth) statWidth.textContent = data.width;
      if (statHeight) statHeight.textContent = data.height;
      if (statCap) statCap.textContent = data.capacity;
      if (statPayload) statPayload.textContent = data.payload;
      if (statTare) statTare.textContent = data.tare;
    });
  });
}

/* ==========================================================================
   10. CAREERS VACANCY SEARCH & DEPARTMENT FILTERING
   ========================================================================== */
function initJobVacancyFilter() {
  const searchInput = document.querySelector('.vacancy-search-input');
  const filterChips = document.querySelectorAll('.filter-chip');
  const vacancyItems = document.querySelectorAll('.vacancy-item');

  if (!vacancyItems.length) return;

  function filterVacancies() {
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const activeChip = document.querySelector('.filter-chip.active');
    const selectedDept = activeChip ? activeChip.getAttribute('data-dept') : 'all';

    vacancyItems.forEach(item => {
      const title = item.querySelector('.vacancy-title')?.textContent.toLowerCase() || '';
      const text = item.querySelector('.vacancy-text')?.textContent.toLowerCase() || '';
      const dept = item.getAttribute('data-department') || '';

      const matchesQuery = !query || title.includes(query) || text.includes(query);
      const matchesDept = selectedDept === 'all' || dept === selectedDept;

      if (matchesQuery && matchesDept) {
        item.style.display = 'flex';
      } else {
        item.style.display = 'none';
      }
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', filterVacancies);
  }

  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      filterChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      filterVacancies();
    });
  });
}

/* ==========================================================================
   11. CAREERS JOB APPLICATION MODAL
   ========================================================================== */
function initCareerApplyModal() {
  const modal = document.querySelector('.career-modal-overlay');
  const applyBtns = document.querySelectorAll('.btn-apply-job');
  const closeBtn = document.querySelector('.career-modal-close');
  const jobTitleSpan = document.querySelector('.career-modal-job-title');
  const jobInput = document.querySelector('.career-modal-job-input');
  const form = document.querySelector('.career-application-form');
  const modalHeader = modal ? modal.querySelector('.career-modal-header') : null;
  const successView = modal ? modal.querySelector('.career-modal-success') : null;
  const noticeEl = modal ? modal.querySelector('.career-form-notice') : null;
  const successDoneBtn = modal ? modal.querySelector('.btn-career-success-done') : null;
  const successCloseBtn = modal ? modal.querySelector('.career-success-close-btn') : null;

  if (!modal) return;

  function showNotice(msg, isError = true) {
    if (!noticeEl) return;
    noticeEl.textContent = msg;
    noticeEl.className = 'career-form-notice' + (isError ? ' error' : '');
    noticeEl.style.display = 'block';
  }

  function hideNotice() {
    if (!noticeEl) return;
    noticeEl.style.display = 'none';
    noticeEl.textContent = '';
  }

  function showFormView() {
    if (modalHeader) modalHeader.style.display = 'flex';
    if (form) form.style.display = 'flex';
    if (successView) successView.style.display = 'none';
    hideNotice();
  }

  function formatPlainEnglishDate(date = new Date()) {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const day = date.getDate();
    let suffix = 'th';
    if (day === 1 || day === 21 || day === 31) suffix = 'st';
    else if (day === 2 || day === 22) suffix = 'nd';
    else if (day === 3 || day === 23) suffix = 'rd';

    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;

    return `${day}${suffix} ${months[date.getMonth()]} ${date.getFullYear()} at ${hours}:${minutes} ${ampm}`;
  }

  function showSuccessView(payload, formattedDate) {
    if (modalHeader) modalHeader.style.display = 'none';
    if (form) form.style.display = 'none';
    if (successView) {
      const nameEl = successView.querySelector('.career-success-name');
      const jobEl = successView.querySelector('.career-success-job');
      const nameVal = successView.querySelector('.career-success-name-val');
      const jobVal = successView.querySelector('.career-success-job-val');
      const emailVal = successView.querySelector('.career-success-email-val');
      const phoneVal = successView.querySelector('.career-success-phone-val');
      const fileVal = successView.querySelector('.career-success-file-val');
      const timeVal = successView.querySelector('.career-success-timestamp');

      if (nameEl) nameEl.textContent = payload.applicant_name || 'Candidate';
      if (jobEl) jobEl.textContent = payload.job_title || 'Position';
      if (nameVal) nameVal.textContent = payload.applicant_name || '—';
      if (jobVal) jobVal.textContent = payload.job_title || '—';
      if (emailVal) emailVal.textContent = payload.applicant_email || '—';
      if (phoneVal) phoneVal.textContent = payload.applicant_phone || '—';
      if (fileVal) fileVal.textContent = payload.file_name || 'Uploaded PDF';
      if (timeVal) timeVal.textContent = formattedDate;

      successView.style.display = 'block';
      const contentEl = modal.querySelector('.career-modal-content');
      if (contentEl) contentEl.scrollTop = 0;
    }
  }

  applyBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      showFormView();
      const job = btn.getAttribute('data-job') || 'Position Application';
      if (jobTitleSpan) jobTitleSpan.textContent = job;
      if (jobInput) jobInput.value = job;
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  });

  function closeCareerModal() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
    setTimeout(showFormView, 250);
  }

  if (closeBtn) closeBtn.addEventListener('click', closeCareerModal);
  if (successCloseBtn) successCloseBtn.addEventListener('click', closeCareerModal);
  if (successDoneBtn) successDoneBtn.addEventListener('click', closeCareerModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeCareerModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeCareerModal();
    }
  });

  // CV drag-and-drop / tap-to-browse dropzone
  const dropzone = document.getElementById('cv-dropzone');
  const fileInput = document.getElementById('cv-file-input');
  const fileNameEl = document.getElementById('cv-file-name');

  function showSelectedFile(file) {
    if (!file) return;
    hideNotice();
    fileNameEl.textContent = file.name;
    dropzone.classList.add('has-file');
  }

  if (dropzone && fileInput) {
    dropzone.addEventListener('click', () => fileInput.click());
    dropzone.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        fileInput.click();
      }
    });

    fileInput.addEventListener('change', () => {
      if (fileInput.files[0]) showSelectedFile(fileInput.files[0]);
    });

    ['dragenter', 'dragover'].forEach((evt) => {
      dropzone.addEventListener(evt, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add('drag-over');
      });
    });

    ['dragleave', 'drop'].forEach((evt) => {
      dropzone.addEventListener(evt, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove('drag-over');
      });
    });

    dropzone.addEventListener('drop', (e) => {
      const file = e.dataTransfer.files[0];
      if (!file) return;
      if (file.type !== 'application/pdf') {
        showNotice('Please attach your CV as a PDF file.');
        return;
      }
      fileInput.files = e.dataTransfer.files;
      showSelectedFile(file);
    });
  }

  const GOOGLE_CAREERS_APP_URL = 'https://script.google.com/macros/s/AKfycbwaiOLt4_BItufuebX5wQii8knh59-7MKcydWqGpBI0e4S1xIja_5Sm2zgPp2RQaPMkTQ/exec';

  function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
      if (!file || !file.size) return resolve('');
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideNotice();

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      const originalHTML = submitBtn ? submitBtn.innerHTML : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="button-text _01">Uploading CV &amp; Submitting...</span>';
      }

      const data = new FormData(form);
      const resumeFile = fileInput && fileInput.files ? fileInput.files[0] : null;

      if (resumeFile && resumeFile.size > 5 * 1024 * 1024) {
        showNotice('Your CV file exceeds 5MB. Please upload a PDF under 5MB.');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalHTML;
        }
        return;
      }

      try {
        const base64Data = await readFileAsBase64(resumeFile);

        const expMap = {
          'entry': 'Entry Level / Graduate',
          '1-3': '1 - 3 Years Relevant Experience',
          '3-5': '3 - 5 Years Relevant Experience',
          '5+': '5+ Years (Senior / Specialist)'
        };
        const selectedExp = data.get('experience_range') || '';
        const expLabel = expMap[selectedExp] || selectedExp;

        const payload = {
          job_title: data.get('job_title') || 'General Application',
          applicant_name: (data.get('applicant_name') || '').trim(),
          applicant_email: (data.get('applicant_email') || '').trim(),
          applicant_phone: (data.get('applicant_phone') || '').trim(),
          experience: expLabel,
          companies_worked: 'Detailed in Attached CV',
          recent_roles: data.get('job_title') || 'Candidate',
          qualifications: 'See attached PDF',
          cover_note: (data.get('cover_note') || '').trim(),
          linkedin_url: (data.get('linkedin_url') || '').trim(),
          file_base64: base64Data,
          file_name: resumeFile ? resumeFile.name : 'candidate_cv.pdf',
          status: 'New Application',
          hr_remarks: ''
        };

        // 1. Post to Google Apps Script Web App (auto-sorts to Google Drive folder & Google Sheet)
        try {
          const res = await fetch(GOOGLE_CAREERS_APP_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'text/plain;charset=utf-8',
            },
            body: JSON.stringify(payload),
          });
          const gasRes = await res.json();
          console.log('[Neptune Careers] Google Drive & Sheet sync complete:', gasRes);
        } catch (fetchErr) {
          console.warn('[Neptune Careers] Direct fetch note:', fetchErr);
        }

        // 2. Instant email backup delivery via Web3Forms
        submitFormData({
          form_name: 'Careers Application Form',
          job_title: payload.job_title,
          applicant_name: payload.applicant_name,
          email: payload.applicant_email,
          phone: payload.applicant_phone,
          experience: payload.experience_range,
          linkedin: payload.linkedin_url || 'N/A',
          cover_note: payload.cover_note || 'N/A',
          cv_file_name: payload.file_name,
        }, `[Job Application] ${payload.job_title} - ${payload.applicant_name}`);

        // 3. Display official in-modal confirmation receipt
        const formattedDate = formatPlainEnglishDate();
        showSuccessView(payload, formattedDate);

        // Reset form fields
        form.reset();
        if (dropzone) dropzone.classList.remove('has-file');
        if (fileNameEl) fileNameEl.textContent = '';

      } catch (err) {
        console.error('[Neptune Careers] Submission error:', err);
        showNotice('We could not upload your CV. Please verify your file or email it directly to info@neptunelogistics.lk');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalHTML;
        }
      }
    });
  }
}

/* ==========================================================================
   11b. INDIVIDUAL JOB DESCRIPTION PAGE (career-detail.html)
   Contains full job descriptions in clear, plain English, straight to the
   point, and tailored directly to Sri Lanka logistics and trade operations.
   ========================================================================== */
const NEPTUNE_COMPANY_DESCRIPTION = "Neptune Logistics (PVT) LTD is a privately owned logistics company with extensive experience in freight, customs clearance, and end-to-end supply chain solutions. The organization is committed to delivering excellence in a fast-moving, interconnected, and evolving global trade environment. Guided by principles of environmental responsibility, cost efficiency, innovation, and strong client commitment, Neptune Logistics focuses on sustainable service delivery. The company provides value-added services, including consulting on customs processes and procedures, applying stringent values and best practices in daily operations. Neptune Logistics emphasizes relationship-based selling, aiming to build lasting, long-term partnerships with clients.";

const NEPTUNE_JOBS = {
  'business-development-manager': {
    title: 'Business Development Manager (BDM)',
    department: 'Sales & Business Development',
    location: 'Colombo 13, Sri Lanka',
    timeType: 'Full Time',
    experience: '4+ Years Freight Sales Experience',
    badge: 'Business Development',
    shortDesc: 'As a Business Development Manager at Neptune, your primary objective is to drive substantial financial growth by acquiring new customers and expanding relationships with existing ones across ocean freight, air freight, and customs clearance solutions.',
    companyDesc: NEPTUNE_COMPANY_DESCRIPTION,
    rolePurpose: 'As a Business Development Manager at Neptune, your primary objective is to drive substantial financial growth by acquiring new customers and expanding relationships with existing ones. By understanding customer requirements and aligning them with Neptune solutions, you will play a crucial role in achieving targeted revenue growth and enhancing customer satisfaction.',
    responsibilities: [
      'Generate and nurture leads in coordination with vertical marketing and field marketing activities to drive targeted revenue growth.',
      'Cultivate and nurture leads within assigned geographies, leveraging a value-based approach to create opportunities.',
      'Manage and expand existing business relationships to generate sustainable revenue growth, including exploring additional regions and products.',
      'Understand and analyze customers\' business objectives to act as a consultant, translating their strategies into valuable opportunities for Neptune Logistics.',
      'Present solutions to customers, demonstrating business value and alignment with their goals.',
      'Identify and develop relationships with key contacts within targeted customer organizations to maximize leverage for Neptune Logistics.',
      'Collaborate with the solutions group to define innovative solutions that address customer needs and add value to their business operations.'
    ],
    qualifications: [
      'Strong skills in business development, sales planning, and client relationship management, with the ability to conduct effective presentations and negotiations.',
      'Knowledge of logistics, freight forwarding, customs clearance, and supply chain management, including familiarity with industry regulations and best practices.',
      'Proficiency in market research, data analysis, and forecasting to identify opportunities and support strategic decision-making.',
      'Excellent communication and interpersonal skills, with the ability to collaborate across teams and engage professionally with diverse stakeholders.',
      'Ability to work independently, manage multiple priorities, and meet targets in a fast-paced environment.',
      'Bachelor’s degree in Business, Logistics, Supply Chain Management, or a related field; equivalent experience in logistics or freight forwarding is highly valued.',
      'Experience in B2B sales or account management, preferably within logistics or related industries.',
      'Proficiency in standard office software and CRM tools; familiarity with ERP or logistics management systems is an advantage.'
    ]
  },

  'senior-customs-house-agent': {
    title: 'Senior Customs House Agent',
    department: 'Customs House Agency (CHA)',
    location: 'Colombo 13 & Port of Colombo, Sri Lanka',
    timeType: 'Full Time',
    experience: '5+ Years Customs Clearance Experience',
    badge: 'Customs Brokerage',
    shortDesc: 'Manage and oversee customs clearance operations at the Port of Colombo and Katunayake Air Cargo. Ensure all import and export consignments comply with Sri Lanka Customs regulations without delays or penalties.',
    companyDesc: NEPTUNE_COMPANY_DESCRIPTION,
    rolePurpose: 'As a Senior Customs House Agent at Neptune, your primary objective is to manage and oversee all customs clearance operations at the Port of Colombo and Katunayake Air Cargo. You will ensure that all import and export consignments comply with Sri Lanka Customs regulations, avoiding delays and unnecessary penalties for our clients.',
    responsibilities: [
      'Prepare, verify, and electronically lodge Customs Declarations (CusDec) using the Sri Lanka Customs ASYCUDA World system.',
      'Classify goods accurately according to Harmonized System (HS) codes, applicable duty rates, cess, VAT, PAL, and special trade agreements.',
      'Coordinate with Sri Lanka Customs officers, wharf inspection teams, and border regulatory bodies (Import & Export Control, SLSI, Quarantine, Ministry of Health) for cargo examinations and release.',
      'Oversee the collection and validation of shipping documents, including Bills of Lading (BL), Commercial Invoices, Packing Lists, Certificates of Origin, and Delivery Orders (DO).',
      'Supervise wharf clerks and documentation assistants during physical wharf examination and container gate-out procedures.',
      'Advise clients on import/export duty structures, BOI regulations, bonded warehousing (TIEP scheme), and customs clearance procedures.',
      'Resolve clearance bottlenecks, tariff disputes, and customs queries promptly to ensure fast turnaround times.'
    ],
    qualifications: [
      'Valid Customs House Agent (CHA) license registered with Sri Lanka Customs is required (or candidate who has passed the Sri Lanka Customs CHA Examination).',
      'Minimum of 5 years of practical hands-on experience in customs clearance and wharf operations in Sri Lanka.',
      'Expert knowledge of the ASYCUDA World system and Sri Lanka Customs tariff regulations and documentation.',
      'Thorough understanding of Colombo Port container terminals (JCT, SAGT, CICT, CWIT) and air cargo handling at Katunayake.',
      'Strong problem-solving skills with the ability to resolve operational issues at the wharf independently.',
      'Good communication skills in English and Sinhala (Tamil is an added advantage) to liaise effectively with customs officials and corporate clients.',
      'High ethical standards and attention to detail in documentation and compliance.'
    ]
  },

  'head-of-accounting': {
    title: 'Head of Accounting',
    department: 'Finance & Accounting',
    location: 'Colombo 13, Sri Lanka',
    timeType: 'Full Time',
    experience: '6+ Years Accounting Experience',
    badge: 'Finance & Tax',
    shortDesc: 'Lead the finance and accounting department, ensuring accurate financial reporting, freight billing reconciliation, cash flow stability, and full compliance with Sri Lankan tax laws.',
    companyDesc: NEPTUNE_COMPANY_DESCRIPTION,
    rolePurpose: 'As Head of Accounting at Neptune, your primary objective is to lead the finance department, ensuring accurate financial management, timely freight billing, cash flow stability, and full compliance with Sri Lankan tax laws and accounting standards.',
    responsibilities: [
      'Oversee day-to-day accounting operations, including accounts payable, accounts receivable, general ledger, bank reconciliations, and payroll.',
      'Manage freight billing, ocean and air freight disbursements, customs duty payments, demurrage reconciliation, and overseas agent statements.',
      'Ensure strict compliance with Sri Lanka Inland Revenue Department (IRD) requirements, including VAT, SVAT, SSCL, WHT, and Corporate Income Tax returns.',
      'Prepare monthly, quarterly, and annual financial statements, profit & loss reports, and variance analyses for senior management and board review.',
      'Monitor company cash flow, manage working capital, and maintain strong banking relationships for trade facilities and foreign exchange transactions.',
      'Lead the external and internal audit processes, liaising with auditors to ensure clean audit reports.',
      'Supervise and mentor the accounting team, streamlining internal controls and accounting software workflows.'
    ],
    qualifications: [
      'Fully or partially qualified in CA Sri Lanka, CIMA (UK), ACCA (UK), or a Bachelor’s degree in Accounting / Finance.',
      'Minimum of 6 years of accounting experience, with at least 2 to 3 years in a managerial or senior supervisory role (experience in freight forwarding, shipping, or logistics is a strong advantage).',
      'Sound knowledge of Sri Lankan tax laws, VAT/SVAT systems, RAMIS, and statutory regulations.',
      'Hands-on experience with accounting ERP software (such as QuickBooks, Sage, Xero, or specialized freight ERPs) and advanced Microsoft Excel skills.',
      'Strong analytical and leadership skills with high integrity and commercial acumen.',
      'Excellent communication skills to coordinate with shipping lines, overseas partners, local clients, and executive directors.'
    ]
  },

  'supply-chain-key-account-manager': {
    title: 'Supply Chain Key Account Manager',
    department: 'Key Account & Client Success',
    location: 'Colombo 13 (Hybrid), Sri Lanka',
    timeType: 'Full Time',
    experience: '4+ Years Key Account Experience',
    badge: 'Key Accounts',
    shortDesc: 'Manage strategic relationships with our largest enterprise clients (apparel, tea, retail, and manufacturing). Ensure smooth end-to-end cargo movement and exceptional customer satisfaction.',
    companyDesc: NEPTUNE_COMPANY_DESCRIPTION,
    rolePurpose: 'As a Supply Chain Key Account Manager at Neptune, your primary objective is to manage relationships with our largest enterprise clients—such as apparel manufacturers, tea exporters, and commercial importers—ensuring seamless end-to-end cargo movement and exceptional customer satisfaction.',
    responsibilities: [
      'Serve as the dedicated single point of contact for assigned key accounts, overseeing their global ocean freight, air freight, and local customs operations.',
      'Monitor shipment milestones from origin booking to final warehouse delivery, proactively identifying potential delays and providing immediate solutions.',
      'Conduct regular performance reviews and service update meetings with clients, sharing status reports and cost-saving opportunities.',
      'Coordinate closely with Neptune’s operations, customs wharf team, and overseas agents to ensure client service level agreements (SLAs) are met.',
      'Identify new logistics needs within existing accounts and propose additional solutions (such as buyer\'s consolidation, warehousing, or air-sea routing).',
      'Manage client billing queries, rate card renewals, and dispute resolutions in a professional and prompt manner.',
      'Gather customer feedback to continuously improve Neptune\'s service standards and operational workflows.'
    ],
    qualifications: [
      'Bachelor\'s degree in Supply Chain Management, Logistics, Business Administration, or related discipline; or equivalent practical experience.',
      'Minimum 4 years of experience in key account management, customer service, or operations within the freight forwarding or logistics sector in Sri Lanka.',
      'Good understanding of international trade terms (Incoterms 2020), ocean & air shipping documentation, and Sri Lankan import/export processes.',
      'Strong relationship-building skills with a customer-centric and problem-solving mindset.',
      'Excellent communication, presentation, and negotiation skills in English (Sinhala/Tamil fluency is beneficial).',
      'Ability to handle pressure and manage multiple client requests simultaneously with great attention to detail.'
    ]
  },

  'logistics-wharf-documentation-officer': {
    title: 'Logistics & Wharf Documentation Officer',
    department: 'Customs House Agency (CHA)',
    location: 'Colombo 13 & Port of Colombo, Sri Lanka',
    timeType: 'Full Time',
    experience: '2+ Years Shipping Documentation',
    badge: 'Wharf Documentation',
    shortDesc: 'Process all shipping, Delivery Order (DO), and customs documentation accurately and on time, ensuring cargo moves through Colombo Port terminals and air cargo facilities without delays or extra charges.',
    companyDesc: NEPTUNE_COMPANY_DESCRIPTION,
    rolePurpose: 'As a Logistics & Wharf Documentation Officer at Neptune, your primary objective is to process all shipping and customs documentation accurately and on time, ensuring cargo moves through Colombo Port terminals and air cargo facilities without delays or extra charges.',
    responsibilities: [
      'Check and verify all incoming shipping documents (Bill of Lading, Invoice, Packing List, Certificate of Origin) for accuracy before submission.',
      'Collect Delivery Orders (DO) from shipping lines and consolidators, and process payments for terminal handling, freight, and container deposits.',
      'Prepare CusDec entries and supporting documentation for submission to Sri Lanka Customs.',
      'Liaise with Colombo Port terminal offices (JCT, SAGT, CICT) and Sri Lanka Ports Authority (SLPA) for gate passes, container de-stuffing, and loading permits.',
      'Track container detention and demurrage free days, making sure all shipments are cleared within the allowed free time.',
      'Assist wharf clerks on-site with documentation endorsements, cargo inspections, and customs assessments.',
      'Maintain accurate digital and physical documentation records for every cleared shipment.'
    ],
    qualifications: [
      'Successful completion of G.C.E. A/Levels; a diploma or certificate in Logistics, Supply Chain, or Customs Clearance is an added advantage.',
      'Minimum 2 years of experience in shipping documentation, freight forwarding, or customs wharf operations in Sri Lanka.',
      'Familiarity with shipping line Delivery Order (DO) procedures, container terminal procedures, and basic ASYCUDA documentation.',
      'Basic understanding of Sri Lankan port customs rules, container clearance, and port gate pass procedures.',
      'Good computer literacy (email, MS Excel, MS Word, and document scanning).',
      'Good communication skills in Sinhala and English; ability to work diligently under time constraints.',
      'High attention to detail and honest, dependable work ethic.'
    ]
  }
};

function initCareerDetailPage() {
  const titleEl = document.getElementById('job-detail-title');
  if (!titleEl) return;

  const contentEl = document.getElementById('job-detail-content');
  const notFoundEl = document.getElementById('job-detail-notfound');
  const crumbEl = document.getElementById('job-detail-crumb');
  const detailsOverview = document.getElementById('job-details-overview');

  const params = new URLSearchParams(window.location.search);
  const rawSlug = params.get('job');
  // Default to business-development-manager if no param is given
  const slug = rawSlug ? rawSlug.trim().toLowerCase() : 'business-development-manager';

  const job = NEPTUNE_JOBS[slug];

  if (!job) {
    if (contentEl) contentEl.hidden = true;
    if (detailsOverview) detailsOverview.hidden = true;
    if (notFoundEl) notFoundEl.hidden = false;
    document.title = 'Position Not Found | Careers | Neptune Logistics Colombo';
    return;
  }

  // Restore content visibility if previously hidden
  if (contentEl) contentEl.hidden = false;
  if (detailsOverview) detailsOverview.hidden = false;
  if (notFoundEl) notFoundEl.hidden = true;

  // Set Page Title and Breadcrumb
  document.title = `${job.title} | Careers | Neptune Logistics Colombo`;
  titleEl.textContent = job.title;
  if (crumbEl) crumbEl.textContent = job.title;

  // Set Department and Summary
  const deptEl = document.getElementById('job-detail-dept');
  if (deptEl) deptEl.textContent = job.department;

  const descEl = document.getElementById('job-detail-desc');
  if (descEl) descEl.textContent = job.shortDesc;

  // Build Tags
  const tagWrap = document.getElementById('job-detail-tags');
  if (tagWrap) {
    tagWrap.innerHTML = `
      <span class="vacancy-tag">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
        ${job.location}
      </span>
      <span class="vacancy-tag">
        <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>
        ${job.timeType}
      </span>
      <span class="vacancy-tag">${job.experience}</span>
      <span class="vacancy-tag" style="background: var(--blue-light); color: var(--primary-blue);">${job.badge}</span>
    `;
  }

  // Set Company Description & Role Purpose
  const companyDescEl = document.getElementById('job-company-desc');
  if (companyDescEl) companyDescEl.textContent = job.companyDesc;

  const rolePurposeEl = document.getElementById('job-role-purpose');
  if (rolePurposeEl) rolePurposeEl.textContent = job.rolePurpose;

  // Helper for checkmarks
  const checkSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>';

  // Set Responsibilities List
  const respList = document.getElementById('job-responsibilities-list');
  if (respList && Array.isArray(job.responsibilities)) {
    respList.innerHTML = job.responsibilities.map(item => `
      <li>
        ${checkSvg}
        <span>${item}</span>
      </li>
    `).join('');
  }

  // Set Qualifications List
  const qualList = document.getElementById('job-qualifications-list');
  if (qualList && Array.isArray(job.qualifications)) {
    qualList.innerHTML = job.qualifications.map(item => `
      <li>
        ${checkSvg}
        <span>${item}</span>
      </li>
    `).join('');
  }

  // Set Sidebar Overview Specs
  const sideRole = document.getElementById('job-side-role');
  if (sideRole) sideRole.textContent = job.title;

  const sideLoc = document.getElementById('job-side-loc');
  if (sideLoc) sideLoc.textContent = job.location;

  const sideType = document.getElementById('job-side-type');
  if (sideType) sideType.textContent = job.timeType;

  const sideDept = document.getElementById('job-side-dept');
  if (sideDept) sideDept.textContent = job.department;

  // Bind All Apply Buttons on page to open modal for this position
  document.querySelectorAll('.btn-apply-job').forEach((btn) => {
    btn.setAttribute('data-job', job.title);
  });
}

/* ==========================================================================
   8b. CONTACT PAGE FORM (matches uthao reference field set)
   ========================================================================== */
function initContactForm() {
  const form = document.getElementById('neptune-contact-form');
  if (!form) return;

  const successState = document.getElementById('contact-success-state');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalHTML = submitBtn ? submitBtn.innerHTML : '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="button-text _01">Sending...</span>';
    }

    const data = new FormData(form);
    submitFormData(
      {
        name: data.get('full_name'),
        email: data.get('email'),
        phone: data.get('phone'),
        service_required: data.get('service_required'),
        city: data.get('city'),
        state: data.get('state'),
        zip_code: data.get('zip_code'),
        message: data.get('message'),
      },
      `New Contact Enquiry - ${data.get('full_name') || 'Neptune Website'}`
    ).finally(() => {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalHTML;
      }
      form.reset();
      form.style.display = 'none';
      if (successState) successState.style.display = 'block';
    });
  });
}

/* ==========================================================================
   8b. OFFICE LOCATOR MAP TOGGLE (contact page: switch pin between offices)
   ========================================================================== */
function initOfficeLocatorToggle() {
  const toggles = document.querySelectorAll('.office-locator-toggle');
  const iframe = document.getElementById('office-locator-iframe');
  if (!toggles.length || !iframe) return;

  toggles.forEach((btn) => {
    btn.addEventListener('click', () => {
      toggles.forEach((b) => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');

      const query = encodeURIComponent(btn.dataset.query);
      iframe.src = `https://maps.google.com/maps?q=${query}&output=embed`;
      iframe.title = btn.dataset.title;
    });
  });
}

/* ==========================================================================
   8c. MOBILE "SHOW MORE" COLLAPSE (FAQ lists, alternating detail rows)
   Mobile only (gated entirely by CSS media query, so this is a no-op visually
   on desktop): trims long repeated lists down to a short default and reveals
   the rest behind one toggle button, so mobile visitors aren't stuck
   scrolling past a dozen FAQ items or five near-identical feature rows.
   ========================================================================== */
function initMobileCollapsibleLists() {
  const configs = [
    { list: '.faq-accordion-list', itemClass: 'faq-item', keep: 3, label: 'question' },
    { list: '.service-alt-rows-wrap', itemClass: 'service-alt-row', keep: 2, label: 'section' },
  ];

  configs.forEach(({ list, itemClass, keep, label }) => {
    document.querySelectorAll(list).forEach((container) => {
      const items = Array.from(container.children).filter((el) => el.classList.contains(itemClass));
      if (items.length <= keep) return;

      const extra = items.slice(keep);
      extra.forEach((el) => el.classList.add('mobile-collapsible-extra'));
      container.classList.add('mobile-collapsible-list');

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'mobile-collapsible-toggle';
      const plural = extra.length > 1 ? 's' : '';
      const updateLabel = () => {
        const expanded = container.classList.contains('is-expanded');
        btn.textContent = expanded ? 'Show less' : `Show ${extra.length} more ${label}${plural}`;
      };
      updateLabel();
      btn.addEventListener('click', () => {
        container.classList.toggle('is-expanded');
        updateLabel();
      });
      container.insertAdjacentElement('afterend', btn);
    });
  });
}

/* ==========================================================================
   8d. MOBILE CARD CAROUSELS (bento overview, hubs, industries, benefit pillars)
   Mobile only (CSS-gated, see .mobile-card-carousel): turns a stacked card
   grid into a one-card swipe carousel with arrow controls, on every page that
   uses these shared sections. Desktop grid layout is untouched.
   ========================================================================== */
const MOBILE_CARD_CAROUSEL_SELECTORS = [
  '.overview-bento-grid',
  '.hubs-grid',
  '.industries-grid',
  '.benefit-item-wrap',
  '.stats-counter-grid',
];

function initMobileCardCarousels() {
  MOBILE_CARD_CAROUSEL_SELECTORS.forEach((selector) => {
    document.querySelectorAll(selector).forEach((container) => {
      container.classList.add('mobile-card-carousel');

      const controls = document.createElement('div');
      controls.className = 'mobile-carousel-controls';
      controls.innerHTML = `
        <button type="button" class="carousel-arrow-btn" aria-label="Previous">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
        </button>
        <button type="button" class="carousel-arrow-btn" aria-label="Next">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
        </button>
      `;
      container.insertAdjacentElement('afterend', controls);

      const [prevBtn, nextBtn] = controls.querySelectorAll('button');
      const scrollByCard = (direction) => {
        const card = container.children[0];
        if (!card) return;
        const gap = parseFloat(getComputedStyle(container).columnGap) || 16;
        const amount = card.getBoundingClientRect().width + gap;
        container.scrollBy({ left: amount * direction, behavior: 'smooth' });
      };
      prevBtn.addEventListener('click', () => scrollByCard(-1));
      nextBtn.addEventListener('click', () => scrollByCard(1));
    });
  });
}

/* ==========================================================================
   8d2. MOBILE NAV ACCORDION (Services / Company groups collapse by default)
   ========================================================================== */
function initMobileNavAccordion() {
  document.querySelectorAll('.mobile-nav-group-toggle').forEach((btn) => {
    btn.addEventListener('click', () => {
      const group = btn.closest('.mobile-nav-group');
      const isOpen = group.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  });
}

/* ==========================================================================
   8e. COOKIE CONSENT BANNER
   Site-wide, injected via JS (no per-page HTML). Gates real analytics: GA4
   in js/analytics.js only fires once 'accepted' is stored here.
   ========================================================================== */
function initCookieConsent() {
  const STORAGE_KEY = 'neptune-cookie-consent';
  if (localStorage.getItem(STORAGE_KEY)) return;

  const isSubdir = window.location.pathname.includes('/services/') || window.location.pathname.includes('/industries/');
  const root = isSubdir ? '../' : './';

  const banner = document.createElement('div');
  banner.className = 'cookie-consent-banner';
  banner.setAttribute('role', 'region');
  banner.setAttribute('aria-label', 'Cookie consent');
  banner.innerHTML = `
    <p class="cookie-consent-text">
      We use a few cookies to keep this site running smoothly and, only with your consent, to understand site traffic. See our
      <a href="${root}privacy-policy.html">Privacy Policy</a> for details.
    </p>
    <div class="cookie-consent-actions">
      <button type="button" class="cookie-consent-btn decline">Decline</button>
      <button type="button" class="cookie-consent-btn accept">Accept</button>
    </div>
  `;
  document.body.appendChild(banner);

  requestAnimationFrame(() => {
    document.body.classList.add('has-cookie-banner');
    banner.classList.add('is-visible');
  });

  function dismiss(value) {
    localStorage.setItem(STORAGE_KEY, value);
    banner.classList.remove('is-visible');
    document.body.classList.remove('has-cookie-banner');
    window.setTimeout(() => banner.remove(), 400);
  }

  banner.querySelector('.accept').addEventListener('click', () => dismiss('accepted'));
  banner.querySelector('.decline').addEventListener('click', () => dismiss('declined'));
}

/* ==========================================================================
   9. ALL-SERVICES CAROUSEL (arrows + dot pagination + seamless infinite loop)
   ========================================================================== */
function initServicesCarousel() {
  const track = document.getElementById('services-carousel-track');
  const prevBtn = document.getElementById('services-carousel-prev');
  const nextBtn = document.getElementById('services-carousel-next');
  const dotsWrap = document.getElementById('services-carousel-dots');
  if (!track || !dotsWrap) return;

  const realCards = Array.from(track.children);
  const count = realCards.length;
  if (!count) return;

  // Clone 2 sets before and 2 sets after for truly endless scrolling room
  // Layout: [pre-clones 2] [pre-clones 1] [REAL CARDS] [post-clones 1] [post-clones 2]
  // This gives ample headroom so rapid clicks or dragging never hit a blank wall.
  for (let s = 0; s < 2; s++) {
    realCards.forEach((card) => {
      const clone = card.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      clone.setAttribute('tabindex', '-1');
      track.appendChild(clone);
    });
  }

  for (let s = 0; s < 2; s++) {
    realCards.slice().reverse().forEach((card) => {
      const clone = card.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      clone.setAttribute('tabindex', '-1');
      track.insertBefore(clone, track.firstChild);
    });
  }

  const allCards = Array.from(track.children);
  const totalCards = allCards.length; // 5 * count = 30 cards
  const realStart = count * 2; // real cards start at index 12

  dotsWrap.innerHTML = '';
  realCards.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.setAttribute('aria-label', `Go to service ${i + 1}`);
    if (i === 0) dot.classList.add('active');
    dotsWrap.appendChild(dot);
  });
  const dots = Array.from(dotsWrap.children);

  function nearestCombinedIndex() {
    const trackLeft = track.scrollLeft;
    let closestIndex = realStart;
    let closestDist = Infinity;
    allCards.forEach((card, i) => {
      const dist = Math.abs(card.offsetLeft - trackLeft);
      if (dist < closestDist) {
        closestDist = dist;
        closestIndex = i;
      }
    });
    return closestIndex;
  }

  function realIndexFromCombined(combinedIndex) {
    return ((combinedIndex - realStart) % count + count) % count;
  }

  function setActiveDot() {
    const combined = nearestCombinedIndex();
    const realIndex = realIndexFromCombined(combined);
    dots.forEach((d, i) => d.classList.toggle('active', i === realIndex));
    allCards.forEach((card, i) => {
      card.classList.toggle('active', realIndexFromCombined(i) === realIndex);
    });
  }

  let settleTimer = null;
  function scheduleSettleCheck() {
    if (settleTimer) clearTimeout(settleTimer);
    settleTimer = setTimeout(() => {
      rebalanceTrack();
    }, 280);
  }

  function rebalanceTrack() {
    const combinedIndex = nearestCombinedIndex();
    // If we have drifted into the outer clone regions, seamlessly snap back to the center real set
    if (combinedIndex < realStart || combinedIndex >= realStart + count) {
      const realIndex = realIndexFromCombined(combinedIndex);
      const targetCard = allCards[realStart + realIndex];
      if (targetCard) {
        track.scrollLeft = targetCard.offsetLeft;
      }
    }
    setActiveDot();
  }

  function step(direction) {
    let combinedIndex = nearestCombinedIndex();

    // Guard: if already near either outer boundary, rebalance before stepping
    if (direction > 0 && combinedIndex >= totalCards - count - 1) {
      const realIndex = realIndexFromCombined(combinedIndex);
      track.scrollLeft = allCards[realStart + realIndex].offsetLeft;
      combinedIndex = realStart + realIndex;
    } else if (direction < 0 && combinedIndex <= count) {
      const realIndex = realIndexFromCombined(combinedIndex);
      track.scrollLeft = allCards[realStart + realIndex].offsetLeft;
      combinedIndex = realStart + realIndex;
    }

    const nextCombined = combinedIndex + direction;
    if (allCards[nextCombined]) {
      track.scrollTo({ left: allCards[nextCombined].offsetLeft, behavior: 'smooth' });
    }
    scheduleSettleCheck();
  }

  function jumpToReal(targetRealIndex) {
    const combinedIndex = nearestCombinedIndex();
    const currentReal = realIndexFromCombined(combinedIndex);
    const forwardDelta = ((targetRealIndex - currentReal) % count + count) % count;
    const targetCombined = combinedIndex + forwardDelta;
    if (allCards[targetCombined]) {
      track.scrollTo({ left: allCards[targetCombined].offsetLeft, behavior: 'smooth' });
    }
    scheduleSettleCheck();
  }

  track.addEventListener('scroll', () => {
    window.requestAnimationFrame(setActiveDot);
  }, { passive: true });

  if ('onscrollend' in window) {
    track.addEventListener('scrollend', rebalanceTrack, { passive: true });
  }

  if (prevBtn) prevBtn.addEventListener('click', () => { stopAutoAdvance(); step(-1); });
  if (nextBtn) nextBtn.addEventListener('click', () => { stopAutoAdvance(); step(1); });

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => { stopAutoAdvance(); jumpToReal(i); });
  });

  // Auto-advance with pause on interaction
  let autoTimer = null;
  function startAutoAdvance() {
    stopAutoAdvance();
    autoTimer = setInterval(() => {
      step(1);
    }, 4500);
  }
  function stopAutoAdvance() {
    if (autoTimer) {
      clearInterval(autoTimer);
      autoTimer = null;
    }
  }

  track.addEventListener('mouseenter', stopAutoAdvance);
  track.addEventListener('mouseleave', startAutoAdvance);
  track.addEventListener('touchstart', stopAutoAdvance, { passive: true });
  track.addEventListener('touchend', startAutoAdvance, { passive: true });

  // Initial positioning: start on the first real card
  requestAnimationFrame(() => {
    if (allCards[realStart]) {
      track.scrollLeft = allCards[realStart].offsetLeft;
    }
    setActiveDot();
    startAutoAdvance();
  });
}

/* ==========================================================================
   10. INFINITE SEAMLESS MARQUEES
   Ensures marquee tracks always have enough duplicate content to span
   wider than any screen resolution (preventing empty right gaps on wide/ultrawide displays)
   and loop with zero visible seams.
   ========================================================================== */
function initInfiniteMarquees() {
  const outerElements = document.querySelectorAll('.marquee-strip-outer');
  if (!outerElements.length) return;

  outerElements.forEach((outer) => {
    const track = outer.querySelector('.marquee-track');
    if (!track) return;

    // Check if track already has .marquee-group children
    let groups = Array.from(track.querySelectorAll(':scope > .marquee-group'));
    if (groups.length === 0) {
      // If flat items exist, wrap them in a .marquee-group
      const items = Array.from(track.children);
      if (!items.length) return;
      const group1 = document.createElement('div');
      group1.className = 'marquee-group';
      items.forEach((el) => group1.appendChild(el));
      track.appendChild(group1);
      groups = [group1];
    }

    const group1 = groups[0];
    const originalChildren = Array.from(group1.children);
    if (!originalChildren.length) return;

    // Target minimum width: at least 2.2x the viewport width or 3800px (handles 4K monitors)
    const minTargetWidth = Math.max(window.innerWidth * 2.2, 3800);

    // Duplicate items inside group1 until it exceeds minTargetWidth
    let currentWidth = group1.scrollWidth;
    let safetyCounter = 0;
    while (currentWidth < minTargetWidth && safetyCounter < 10) {
      originalChildren.forEach((child) => {
        group1.appendChild(child.cloneNode(true));
      });
      currentWidth = group1.scrollWidth;
      safetyCounter++;
    }

    // Remove any previously appended duplicate groups
    for (let i = 1; i < groups.length; i++) {
      groups[i].remove();
    }

    // Append an exact clone of group1 as group2 for seamless 50% loop
    const group2 = group1.cloneNode(true);
    group2.setAttribute('aria-hidden', 'true');
    track.appendChild(group2);

    // Set consistent, smooth marquee animation speed (~50px per second)
    const speedPxPerSec = 50;
    const duration = Math.max(25, Math.round(group1.scrollWidth / speedPxPerSec));
    track.style.animationDuration = `${duration}s`;

    // Pause on hover
    outer.addEventListener('mouseenter', () => {
      track.style.animationPlayState = 'paused';
    });
    outer.addEventListener('mouseleave', () => {
      track.style.animationPlayState = 'running';
    });
  });
}

