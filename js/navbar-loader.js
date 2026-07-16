/**
 * Neptune Logistics – Shared Navbar Loader
 * Fetches /components/navbar.html and injects it into #navbar-placeholder.
 * Then sets the active link based on the current page.
 */
(function () {
  const placeholder = document.getElementById('navbar-placeholder');
  if (!placeholder) return;

  // Determine the root path (works for both root and /services/ subdirectory)
  const depth = window.location.pathname.split('/').filter(Boolean).length;
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

  fetch(root + 'components/navbar.html?v=1.0.2')
    .then(function (r) { return r.text(); })
    .then(function (html) {
      placeholder.innerHTML = adjustPaths(html);
      initNavbar();
    })
    .catch(function () {
      // Graceful fallback: try absolute path
      fetch('/components/navbar.html?v=1.0.2')
        .then(function (r) { return r.text(); })
        .then(function (html) {
          placeholder.innerHTML = adjustPaths(html);
          initNavbar();
        });
    });

  function initNavbar() {
    const navbar = document.getElementById('site-navbar');
    if (!navbar) return;

    // ── Active page detection ──────────────────────────────────────
    const path = window.location.pathname;
    let currentPage = 'home';
    if (path.includes('about')) currentPage = 'about';
    else if (path.includes('/services/')) currentPage = 'services';
    else if (path.includes('heritage')) currentPage = 'heritage';
    else if (path.includes('portfolio')) currentPage = 'portfolio';
    else if (path.includes('contact')) currentPage = 'contact';
    else if (path.includes('tracking')) currentPage = 'tracking';

    placeholder.querySelectorAll('[data-navpage]').forEach(function (link) {
      if (link.dataset.navpage === currentPage) {
        link.classList.add('active');
      }
    });

    // ── Hamburger and Menu Elements ────────────────────────────────
    const hamburger = navbar.querySelector('.nav-hamburger');
    const mobileMenu = placeholder.querySelector('.nav-mobile');

    // ── Scroll state ───────────────────────────────────────────────
    let lastScroll = 0;
    function handleScroll() {
      const scrollY = window.scrollY;
      document.documentElement.style.setProperty('--scroll-y', scrollY);
      navbar.classList.toggle('scrolled', scrollY > 40);
      navbar.classList.toggle('at-top', scrollY <= 40);

      const progressEl = navbar.querySelector('.nav-scroll-progress');
      if (progressEl) {
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        if (height > 0) {
          const scrolled = (scrollY / height) * 100;
          progressEl.style.width = scrolled + '%';
        }
      }

      if (scrollY > 200) {
        if (scrollY > lastScroll + 5) {
          navbar.style.transform = 'translateY(-100%)';
          // close mobile menu when hiding
          if (mobileMenu) mobileMenu.classList.remove('open');
          if (hamburger) { hamburger.classList.remove('open'); hamburger.setAttribute('aria-expanded', 'false'); }
          document.body.style.overflow = '';
        } else if (scrollY < lastScroll - 5) {
          navbar.style.transform = 'translateY(0)';
        }
      } else {
        navbar.style.transform = 'translateY(0)';
      }
      lastScroll = scrollY;
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    // ── Hamburger toggle ───────────────────────────────────────────
    if (hamburger && mobileMenu) {
      console.log('Mobile hamburger and menu found. Binding click listener...');
      hamburger.addEventListener('click', function () {
        const isOpen = mobileMenu.classList.toggle('open');
        console.log('Hamburger clicked. Mobile menu isOpen:', isOpen);
        hamburger.classList.toggle('open', isOpen);
        hamburger.setAttribute('aria-expanded', String(isOpen));
        document.body.style.overflow = isOpen ? 'hidden' : '';
      });
    } else {
      console.warn('Mobile hamburger or menu not found!', { hamburger, mobileMenu });
    }

    // ── Desktop dropdown ───────────────────────────────────────────
    const hasDropdown = navbar.querySelector('.has-dropdown');
    if (hasDropdown) {
      const dropdownLink = hasDropdown.querySelector('.nav-link');
      const dropdown = hasDropdown.querySelector('.nav-dropdown');

      hasDropdown.addEventListener('mouseenter', function () {
        dropdown && dropdown.classList.add('open');
        dropdownLink && dropdownLink.setAttribute('aria-expanded', 'true');
      });
      hasDropdown.addEventListener('mouseleave', function () {
        dropdown && dropdown.classList.remove('open');
        dropdownLink && dropdownLink.setAttribute('aria-expanded', 'false');
      });

      // Keyboard nav
      dropdownLink && dropdownLink.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const isExpanded = dropdownLink.getAttribute('aria-expanded') === 'true';
          dropdownLink.setAttribute('aria-expanded', String(!isExpanded));
          dropdown && dropdown.classList.toggle('open', !isExpanded);
        }
      });
    }

    // ── Mobile services accordion ──────────────────────────────────
    const mobileServicesToggle = placeholder.querySelector('.nav-mobile-services-toggle');
    const mobileServicesList = placeholder.querySelector('.nav-mobile-services-list');
    console.log('Accordion elements check:', { mobileServicesToggle, mobileServicesList });
    if (mobileServicesToggle && mobileServicesList) {
      mobileServicesToggle.addEventListener('click', function (e) {
        console.log('Mobile Services Toggle clicked!');
        const isOpen = mobileServicesList.classList.toggle('open');
        console.log('Mobile Services List open state toggled to:', isOpen);
        mobileServicesToggle.setAttribute('aria-expanded', String(isOpen));
        const chevron = mobileServicesToggle.querySelector('.dropdown-chevron');
        if (chevron) {
          chevron.classList.toggle('rotated', isOpen);
        } else {
          console.warn('Chevron SVG not found inside Services toggle!');
        }
      });
    } else {
      console.warn('Mobile Services Toggle or List not found in DOM!');
    }

    // Close mobile menu on link click
    placeholder.querySelectorAll('.nav-mobile a').forEach(function (link) {
      link.addEventListener('click', function () {
        console.log('Mobile link clicked, closing menu:', link.getAttribute('href'));
        if (mobileMenu) mobileMenu.classList.remove('open');
        if (hamburger) { hamburger.classList.remove('open'); hamburger.setAttribute('aria-expanded', 'false'); }
        document.body.style.overflow = '';
      });
    });

    // Close mobile menu on outside click
    document.addEventListener('click', function (e) {
      if (mobileMenu && mobileMenu.classList.contains('open')) {
        if (!e.target.closest('#site-navbar') && !e.target.closest('#nav-mobile-menu')) {
          mobileMenu.classList.remove('open');
          if (hamburger) {
            hamburger.classList.remove('open');
            hamburger.setAttribute('aria-expanded', 'false');
          }
          document.body.style.overflow = '';
        }
      }
    });

    // Heritage/Portfolio page-specific navbar classes
    if (document.body.classList.contains('heritage-page')) {
      navbar.classList.add('heritage-navbar');
    }
    if (document.body.classList.contains('portfolio-page')) {
      navbar.classList.add('portfolio-navbar');
    }
    if (document.body.classList.contains('about-page') || 
        document.body.classList.contains('contact-page') || 
        document.body.classList.contains('services-page') ||
        document.body.classList.contains('industries-page') ||
        document.body.classList.contains('tracking-page')) {
      navbar.classList.add('dark-navbar');
    }
  }
})();
