/* ============================================
   NEPTUNE LOGISTICS | ANIMATIONS & INTERACTIONS
   UI/UX Pro Max System
   ============================================ */

(function() {
  'use strict';

  /* ─── 1. NAVBAR SCROLL BEHAVIOUR ─────────────────────── */
  window.addEventListener('scroll', () => {
    document.documentElement.style.setProperty('--scroll-y', window.scrollY);
  }, { passive: true });

  /* ─── 2. SCROLL REVEAL ────────────────────────────────── */
  const revealEls = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        // Keep observing for repeat animations if needed
        // revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

  revealEls.forEach(el => revealObserver.observe(el));

  /* ─── 3. ANIMATED COUNTERS ────────────────────────────── */
  function animateCounter(el, target, duration = 2000, suffix = '') {
    const isDecimal = target % 1 !== 0;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.textContent = isDecimal
        ? target.toFixed(1) + suffix
        : Math.round(target).toLocaleString() + suffix;
      return;
    }

    let start = 0;
    const startTime = performance.now();

    function step(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out expo
      const eased = 1 - Math.pow(1 - progress, 4);
      const current = start + (target - start) * eased;
      el.textContent = isDecimal
        ? current.toFixed(1) + suffix
        : Math.round(current).toLocaleString() + suffix;
      if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !entry.target.dataset.counted) {
        entry.target.dataset.counted = 'true';
        const target = parseFloat(entry.target.dataset.target);
        const suffix = entry.target.dataset.suffix || '';
        const duration = parseInt(entry.target.dataset.duration) || 2000;
        animateCounter(entry.target, target, duration, suffix);
        counterObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('[data-counter]').forEach(el => {
    counterObserver.observe(el);
  });

  /* ─── 4. PARALLAX ─────────────────────────────────────── */
  const parallaxEls = document.querySelectorAll('[data-parallax]');

  if (parallaxEls.length) {
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          parallaxEls.forEach(el => {
            const speed  = parseFloat(el.dataset.parallax) || 0.3;
            const rect   = el.getBoundingClientRect();
            const center = rect.top + rect.height / 2;
            const offset = (window.innerHeight / 2 - center) * speed;
            el.style.transform = `translateY(${offset}px)`;
          });
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  /* ─── 5. HOVER DEPTH (CARD TILT) ──────────────────────── */
  document.querySelectorAll('[data-tilt]').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const cx = rect.left + rect.width  / 2;
      const cy = rect.top  + rect.height / 2;
      const dx = (e.clientX - cx) / (rect.width  / 2);
      const dy = (e.clientY - cy) / (rect.height / 2);
      const intensity = parseFloat(card.dataset.tiltIntensity) || 6;
      card.style.transform = `perspective(800px) rotateY(${dx * intensity}deg) rotateX(${-dy * intensity}deg) translateY(-8px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });

  /* ─── 6. SMOOTH ACTIVE NAV ─────────────────────────────── */
  const sections = document.querySelectorAll('section[id]');
  const navLinks  = document.querySelectorAll('.nav-link[href^="#"]');

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navLinks.forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
        });
      }
    });
  }, { threshold: 0.4 });

  sections.forEach(s => sectionObserver.observe(s));

  /* ─── 7. HERO GLOBE PARTICLES ──────────────────────────── */
  const canvas = document.getElementById('hero-canvas');
  if (canvas) {
    let animationFrameId = null;
    let isAnimated = false;
    const isMobile = window.matchMedia('(max-width: 768px)');
    const ctx = canvas.getContext('2d');

    function resizeCanvas() {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }

    const particles = [];
    const NUM = 60;

    function initParticles() {
      particles.length = 0;
      for (let i = 0; i < NUM; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          size: Math.random() * 1.5 + 0.5,
          alpha: Math.random() * 0.5 + 0.1,
        });
      }
    }

    function drawParticles() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p, i) => {
        particles.slice(i + 1).forEach(q => {
          const dx = p.x - q.x;
          const dy = p.y - q.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(96,165,250,${(1 - dist / 100) * 0.12})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });

      particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(96,165,250,${p.alpha})`;
        ctx.fill();

        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width)  p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height)  p.vy *= -1;
      });

      animationFrameId = requestAnimationFrame(drawParticles);
    }

    function startAnimation() {
      if (!isAnimated && !isMobile.matches) {
        isAnimated = true;
        resizeCanvas();
        initParticles();
        drawParticles();
      }
    }

    function stopAnimation() {
      if (isAnimated) {
        isAnimated = false;
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
          animationFrameId = null;
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }

    window.addEventListener('resize', () => {
      if (isAnimated && !isMobile.matches) {
        resizeCanvas();
      } else if (isMobile.matches) {
        stopAnimation();
      }
    });

    const heroSection = document.getElementById('home') || canvas.closest('section');
    if (heroSection) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !isMobile.matches) {
            startAnimation();
          } else {
            stopAnimation();
          }
        });
      }, { threshold: 0.05 });
      observer.observe(heroSection);
    } else {
      if (!isMobile.matches) {
        startAnimation();
      }
    }
  }

  /* ─── 8. MAP ROUTE ANIMATION TRIGGER ──────────────────── */
  const mapSection = document.getElementById('reach');
  if (mapSection) {
    const mapObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.querySelectorAll('.map-route-line').forEach(line => {
            line.style.animation = 'none';
            void line.offsetWidth;
            line.style.animation = '';
          });
        }
      });
    }, { threshold: 0.3 });
    mapObserver.observe(mapSection);
  }

  /* ─── 9. PAGE LOAD SEQUENCE ────────────────────────────── */
  document.documentElement.classList.add('js-loaded');

  /* ─── 10. SMOOTH ANCHOR SCROLL ─────────────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const offset = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 80;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  /* ─── 11. SERVICE CARD STAGGER ─────────────────────────── */
  const servicesSection = document.getElementById('services');
  if (servicesSection) {
    const cards = servicesSection.querySelectorAll('.service-card');
    const cardObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          cards.forEach((card, i) => {
            card.style.transitionDelay = `${i * 0.08}s`;
            card.classList.add('in-view');
          });
          cardObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    cards.forEach(card => card.classList.add('reveal'));
    cardObserver.observe(servicesSection);
  }

  /* ─── 12. CONTACT FORM SUBMISSION ──────────────────────── */
  const contactForm = document.getElementById('contact-form');
  const servicePills = document.querySelectorAll('.service-pill');
  const serviceHiddenInput = document.getElementById('service');
  const selectedServicesSet = new Set();

  if (servicePills && serviceHiddenInput) {
    servicePills.forEach(pill => {
      pill.addEventListener('click', () => {
        const val = pill.getAttribute('data-value');
        if (pill.classList.contains('active')) {
          pill.classList.remove('active');
          selectedServicesSet.delete(val);
        } else {
          pill.classList.add('active');
          selectedServicesSet.add(val);
        }
        
        // Handle Other option toggle
        if (val === 'Other') {
          const otherWrapper = document.getElementById('other-service-wrapper');
          const otherInput = document.getElementById('other-service-details');
          if (otherWrapper && otherInput) {
            if (pill.classList.contains('active')) {
              otherWrapper.style.display = 'block';
              otherInput.setAttribute('required', 'true');
            } else {
              otherWrapper.style.display = 'none';
              otherInput.removeAttribute('required');
              otherInput.value = '';
              otherInput.classList.remove('invalid');
              const otherErr = document.getElementById('other-service-error');
              if (otherErr) otherErr.textContent = '';
            }
          }
        }
        
        // Update hidden input
        serviceHiddenInput.value = Array.from(selectedServicesSet).join(', ');
        
        // Clear or show error state
        if (selectedServicesSet.size > 0) {
          servicePills.forEach(p => p.classList.remove('invalid'));
          const errSpan = document.getElementById('service-error');
          if (errSpan) errSpan.textContent = '';
        } else {
          servicePills.forEach(p => p.classList.add('invalid'));
          const errSpan = document.getElementById('service-error');
          if (errSpan) errSpan.textContent = 'Please select at least one service';
        }
      });
    });
  }

  // Real-time visual feedback validation
  function validateField(inputEl, forceShowError = false) {
    const id = inputEl.id;
    const value = inputEl.value.trim();
    let errSpan = document.getElementById(`${id}-error`);
    let isValid = true;
    let errMsg = '';

    if (id === 'name') {
      if (!value) {
        isValid = false;
        errMsg = 'Contact name is required';
      }
    } else if (id === 'company') {
      if (!value) {
        isValid = false;
        errMsg = 'Company name is required';
      }
    } else if (id === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!value) {
        isValid = false;
        errMsg = 'Email address is required';
      } else if (!emailRegex.test(value)) {
        isValid = false;
        errMsg = 'Please enter a valid email address';
      }
    } else if (id === 'phone-number') {
      const phoneGroup = document.getElementById('phone-group');
      const phoneCountry = document.getElementById('phone-country');
      errSpan = document.getElementById('phone-error');
      if (phoneGroup && phoneCountry) {
        const number = value;
        const selectedOpt = phoneCountry.options[phoneCountry.selectedIndex];
        const reqDigits = parseInt(selectedOpt.getAttribute('data-digits') || '9');
        if (!number) {
          isValid = false;
          errMsg = 'Phone number is required';
        } else if (number.length < reqDigits - 1 || number.length > reqDigits + 2) {
          isValid = false;
          errMsg = `Please enter a valid phone number (around ${reqDigits} digits)`;
        }
      }
    } else if (id === 'other-service-details') {
      const otherWrapper = document.getElementById('other-service-wrapper');
      if (otherWrapper && otherWrapper.style.display !== 'none') {
        if (!value) {
          isValid = false;
          errMsg = 'Please specify your other service requirements';
        }
      }
    } else if (id === 'origin') {
      if (!value) {
        isValid = false;
        errMsg = 'Origin is required';
      }
    } else if (id === 'destination') {
      if (!value) {
        isValid = false;
        errMsg = 'Destination is required';
      }
    } else if (id === 'cargo-details') {
      if (!value) {
        isValid = false;
        errMsg = 'Cargo weight or volume is required';
      }
    } else if (id === 'message') {
      if (!value) {
        isValid = false;
        errMsg = 'Please briefly explain the service required';
      }
    }

    const targetEl = (id === 'phone-number') ? document.getElementById('phone-group') : inputEl;
    
    if (!isValid) {
      if (forceShowError) {
        if (targetEl) targetEl.classList.add('invalid');
        if (errSpan) errSpan.textContent = errMsg;
      }
    } else {
      if (targetEl) targetEl.classList.remove('invalid');
      if (errSpan) errSpan.textContent = '';
    }
    return isValid;
  }

  const inputsToValidate = document.querySelectorAll('#contact-form .form-input, #contact-form .form-textarea, #contact-form .phone-number-input');
  inputsToValidate.forEach(input => {
    input.addEventListener('blur', () => {
      validateField(input, true);
    });
    input.addEventListener('input', () => {
      const targetEl = (input.id === 'phone-number') ? document.getElementById('phone-group') : input;
      if (targetEl.classList.contains('invalid') || validateField(input, false)) {
        validateField(input, true);
      }
    });
  });

  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      let isValid = true;
      
      // Reset errors
      const errorSpans = contactForm.querySelectorAll('.error-text');
      errorSpans.forEach(span => span.textContent = '');
      
      const formInputs = contactForm.querySelectorAll('.form-input, .form-textarea, .phone-input-group');
      formInputs.forEach(input => input.classList.remove('invalid'));
      servicePills.forEach(pill => pill.classList.remove('invalid'));

      // Validate using validateField helper
      const nameInput = document.getElementById('name');
      const companyInput = document.getElementById('company');
      const emailInput = document.getElementById('email');
      const phoneNumber = document.getElementById('phone-number');
      const messageInput = document.getElementById('message');
      const otherInput = document.getElementById('other-service-details');
      const originInput = document.getElementById('origin');
      const destinationInput = document.getElementById('destination');
      const cargoDetailsInput = document.getElementById('cargo-details');
      const urgencyInput = document.getElementById('urgency');

      if (nameInput && !validateField(nameInput, true)) isValid = false;
      if (companyInput && !validateField(companyInput, true)) isValid = false;
      if (emailInput && !validateField(emailInput, true)) isValid = false;
      if (phoneNumber && !validateField(phoneNumber, true)) isValid = false;
      
      // Validate Services Required
      const serviceError = document.getElementById('service-error');
      if (selectedServicesSet.size === 0) {
        servicePills.forEach(pill => pill.classList.add('invalid'));
        if (serviceError) serviceError.textContent = 'Please select at least one service';
        isValid = false;
      }

      // Validate Other Service Specification
      if (selectedServicesSet.has('Other')) {
        if (otherInput && !validateField(otherInput, true)) isValid = false;
      }

      if (originInput && !validateField(originInput, true)) isValid = false;
      if (destinationInput && !validateField(destinationInput, true)) isValid = false;
      if (cargoDetailsInput && !validateField(cargoDetailsInput, true)) isValid = false;
      if (messageInput && !validateField(messageInput, true)) isValid = false;

      if (!isValid) {
        // Find first invalid input and focus/scroll to it
        const firstInvalid = contactForm.querySelector('.invalid');
        if (firstInvalid) {
          firstInvalid.focus();
          firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      }

      // Show Loading State on submit button
      const btn = contactForm.querySelector('button[type="submit"]');
      const originalText = btn.innerHTML;
      btn.innerHTML = `<span>Sending Enquiry...</span><svg class="spinner" width="16" height="16" viewBox="0 0 50 50"><circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" stroke-width="5" stroke-dasharray="80, 200" stroke-dashoffset="0" stroke-linecap="round"></circle></svg>`;
      btn.style.pointerEvents = 'none';
      btn.style.opacity = '0.8';

      // Capture values
      const name = nameInput.value.trim();
      const company = companyInput.value.trim();
      const email = emailInput.value.trim();
      
      const hiddenPhone = document.getElementById('phone');
      const phoneValue = hiddenPhone ? hiddenPhone.value : (phoneNumber.value.trim());
      
      let services = Array.from(selectedServicesSet).join(', ');
      if (selectedServicesSet.has('Other')) {
        const otherDetails = document.getElementById('other-service-details').value.trim();
        services += ` (Other specify: ${otherDetails})`;
      }
      const origin = originInput.value.trim();
      const destination = destinationInput.value.trim();
      const cargoDetails = cargoDetailsInput.value.trim();
      const urgency = urgencyInput ? urgencyInput.value.trim() : '';
      const message = messageInput.value.trim();
      const submissionPayload = {
        subject: `Neptune Logistics Enquiry from ${name}, ${company}`,
        from_name: name,
        name,
        company,
        email,
        phone: phoneValue,
        service: services,
        origin,
        destination,
        cargo_details: cargoDetails,
        urgency,
        message,
        send_to: 'info@neptunelogistics.lk',
      };

      // Submit through Supabase first, with Web3Forms kept as a fallback until the function is live.
      const showSuccess = () => {
        document.getElementById('contact-form-container').style.display = 'none';
        document.getElementById('contact-success-state').style.display = 'block';
        contactForm.reset();
        servicePills.forEach(pill => pill.classList.remove('active'));
        selectedServicesSet.clear();
        if (serviceHiddenInput) serviceHiddenInput.value = '';
        btn.style.pointerEvents = 'auto';
        btn.style.opacity = '1';
        btn.innerHTML = `<span>Send Enquiry</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`;
        btn.style.background = '';
      };

      const showError = () => {
        btn.innerHTML = originalText;
        btn.style.pointerEvents = 'auto';
        btn.style.opacity = '1';
        const errMsg = document.createElement('p');
        errMsg.style.cssText = 'color:#ef4444;font-size:.85rem;margin-top:12px;text-align:center;';
        errMsg.textContent = 'Something went wrong. Please email info@neptunelogistics.lk directly.';
        const existingErr = contactForm.querySelector('.submit-error');
        if (existingErr) existingErr.remove();
        errMsg.className = 'submit-error';
        contactForm.querySelector('.contact-cta-row').after(errMsg);
      };

      const submitWithSupabase = () => fetch('https://qxvkdwmhdirjascroqww.supabase.co/functions/v1/send-contact-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIUzI1NiIsInJlZiI6InF4dmtkd21oZGlyamFzY3JvcXd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5MDI0MjQsImV4cCI6MjA5NTQ3ODQyNH0.lrXAdOFT58wYOqiuOsXR6kkaplWs7TiwTXlV_PZfX3g',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIUzI1NiIsInJlZiI6InF4dmtkd21oZGlyamFzY3JvcXd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5MDI0MjQsImV4cCI6MjA5NTQ3ODQyNH0.lrXAdOFT58wYOqiuOsXR6kkaplWs7TiwTXlV_PZfX3g',
        },
        body: JSON.stringify(submissionPayload),
      }).then(res => res.json());

      const submitWithWeb3Forms = () => fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          access_key: 'db47306b-6779-4d87-9279-d805de43c70c',
          ...submissionPayload,
          botcheck: ''
        })
      }).then(res => res.json());

      submitWithSupabase()
      .then(data => {
        if (data.success) {
          showSuccess();
        } else {
          return submitWithWeb3Forms().then(fallbackData => {
            if (fallbackData.success) {
              showSuccess();
            } else {
              showError();
            }
          });
        }
      })
      .catch(() => {
        submitWithWeb3Forms()
          .then(fallbackData => {
            if (fallbackData.success) {
              showSuccess();
            } else {
              showError();
            }
          })
          .catch(() => showError());
      });
    });
  }

  // Reset success state back to form
  const btnSuccessReset = document.getElementById('btn-success-reset');
  if (btnSuccessReset) {
    btnSuccessReset.addEventListener('click', () => {
      document.getElementById('contact-success-state').style.display = 'none';
      document.getElementById('contact-form-container').style.display = 'block';
      const contactForm = document.getElementById('contact-form');
      if (contactForm) {
        const btn = contactForm.querySelector('button[type="submit"]');
        if (btn) {
          btn.innerHTML = `<span>Send Enquiry</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`;
          btn.style.background = '';
          btn.style.pointerEvents = 'auto';
          btn.style.opacity = '1';
        }
      }
    });
  }

  /* ─── 13. INTERNATIONAL PHONE INPUT LOGIC ────────────────── */
  const phoneGroup = document.getElementById('phone-group');
  const phoneCountry = document.getElementById('phone-country');
  const phoneNumber = document.getElementById('phone-number');
  const hiddenPhone = document.getElementById('phone');

  if (phoneCountry && phoneNumber && hiddenPhone && phoneGroup) {
    const updatePhone = () => {
      // 1. Immediately strip out any non-numeric character (prevent letters)
      phoneNumber.value = phoneNumber.value.replace(/[^0-9]/g, '');
      
      const prefix = phoneCountry.value;
      const number = phoneNumber.value.trim();
      
      if (number) {
        // Combined value (e.g., +94770000000) for recording
        hiddenPhone.value = prefix + number;
        
        // 2. Real-time length validation
        const selectedOpt = phoneCountry.options[phoneCountry.selectedIndex];
        const reqDigits = parseInt(selectedOpt.getAttribute('data-digits') || '9');
        
        if (number.length < reqDigits - 1 || number.length > reqDigits + 2) {
          phoneGroup.classList.add('invalid');
        } else {
          phoneGroup.classList.remove('invalid');
        }
      } else {
        hiddenPhone.value = '';
        phoneGroup.classList.remove('invalid');
      }
    };

    // Listeners for changes
    phoneCountry.addEventListener('change', () => {
      const selectedOpt = phoneCountry.options[phoneCountry.selectedIndex];
      const placeholder = selectedOpt.getAttribute('data-placeholder');
      phoneNumber.placeholder = placeholder;
      updatePhone();
    });

    phoneNumber.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/\D/g, '');
      updatePhone();
    });

    // Watch keydown for numbers only as double guard
    phoneNumber.addEventListener('keydown', (e) => {
      // Allow control keys (backspace, delete, tab, escape, enter, arrows, select all, etc)
      if (
        e.key === 'Backspace' ||
        e.key === 'Delete' ||
        e.key === 'Tab' ||
        e.key === 'Escape' ||
        e.key === 'Enter' ||
        e.key === 'ArrowLeft' ||
        e.key === 'ArrowRight' ||
        (e.ctrlKey === true || e.metaKey === true) // allow cmd+a, ctrl+c, etc.
      ) {
        return;
      }
      // Block non-digit keys
      if (e.key < '0' || e.key > '9') {
        e.preventDefault();
      }
    });

    // Reset phone inputs correctly when form resets
    if (contactForm) {
      contactForm.addEventListener('reset', () => {
        setTimeout(() => {
          phoneCountry.selectedIndex = 0;
          const selectedOpt = phoneCountry.options[0];
          phoneNumber.placeholder = selectedOpt.getAttribute('data-placeholder');
          phoneGroup.classList.remove('invalid');
          hiddenPhone.value = '';
          
          // Reset service pills active states
          servicePills.forEach(pill => pill.classList.remove('active'));
          selectedServicesSet.clear();
          if (serviceHiddenInput) serviceHiddenInput.value = '';
          
          // Reset other specify
          const otherWrapper = document.getElementById('other-service-wrapper');
          const otherInput = document.getElementById('other-service-details');
          if (otherWrapper && otherInput) {
            otherWrapper.style.display = 'none';
            otherInput.removeAttribute('required');
            otherInput.value = '';
            otherInput.classList.remove('invalid');
            const otherErr = document.getElementById('other-service-error');
            if (otherErr) otherErr.textContent = '';
          }
        }, 0);
      });
    }
  }

  // ─── 14. COUNTRY PILL CLICK NAVIGATION & AUTO-SELECT ─────
  const countryPills = document.querySelectorAll('.country-pill');
  if (countryPills.length > 0) {
    const contactForm = document.getElementById('contact-form');
    const phoneCountry = document.getElementById('phone-country');
    const phoneNumber = document.getElementById('phone-number');
    
    if (phoneCountry && phoneNumber && contactForm) {
      countryPills.forEach(pill => {
        pill.style.cursor = 'pointer';
        pill.addEventListener('click', () => {
          // Extract country name by removing flag emojis/characters and trimming whitespace
          const countryText = pill.textContent.replace(/[\uD83C-\uDBFF\uDC00-\uDFFF]/g, '').trim().toLowerCase();
          
          let matchedOption = null;
          for (let i = 0; i < phoneCountry.options.length; i++) {
            const opt = phoneCountry.options[i];
            const optText = opt.textContent.toLowerCase();
            
            // Match e.g. "sri lanka" in "🇱🇰 +94 (sri lanka)"
            if (optText.includes(countryText)) {
              matchedOption = opt;
              break;
            }
          }
          
          if (matchedOption) {
            phoneCountry.value = matchedOption.value;
            // Trigger change event to update placeholder and formatting
            const event = new Event('change');
            phoneCountry.dispatchEvent(event);
          }
          
          // Smooth scroll up to the interactive globe container with navigation height offset
          const globeContainer = document.querySelector('.globe-interactive-wrap');
          if (globeContainer) {
            const offset = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 80;
            const top = globeContainer.getBoundingClientRect().top + window.scrollY - offset - 20;
            window.scrollTo({ top, behavior: 'smooth' });
          }
        });
      });
    }
  }

  // Bento Cards Hover Glow Effect
  const bentoCards = document.querySelectorAll('.bento-card');
  if (bentoCards.length > 0) {
    bentoCards.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty('--x', `${x}px`);
        card.style.setProperty('--y', `${y}px`);
      });
    });
  }

  // ─── Globe Scroll Hint — hide only at the end of the scrollable area ─────────────
  const globeScrollHint = document.getElementById('globe-scroll-hint');
  const globeCountriesEl = document.getElementById('globe-countries-scroll');
  if (globeScrollHint && globeCountriesEl) {
    const updateHintVisibility = () => {
      const maxScroll = globeCountriesEl.scrollWidth - globeCountriesEl.clientWidth;
      if (maxScroll <= 0 || globeCountriesEl.scrollLeft >= maxScroll - 15) {
        globeScrollHint.classList.add('hidden');
      } else {
        globeScrollHint.classList.remove('hidden');
      }
    };

    globeScrollHint.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      globeCountriesEl.scrollBy({ left: 160, behavior: 'smooth' });
    });

    globeCountriesEl.addEventListener('scroll', updateHintVisibility, { passive: true });
    window.addEventListener('resize', updateHintVisibility, { passive: true });
    
    // Initial check after elements render
    setTimeout(updateHintVisibility, 200);
  }

  /* ─── 15. EXIT INTENT NEWSLETTER POPUP ────────────────── */
  const exitPopup = document.getElementById('exit-popup');
  if (exitPopup) {
    const closeBtn = exitPopup.querySelector('.exit-popup-close');
    const form = exitPopup.querySelector('.exit-popup-form');
    const input = exitPopup.querySelector('.exit-popup-input');
    const msg = exitPopup.querySelector('.exit-popup-message');

    const showPopup = () => {
      if (!sessionStorage.getItem('exit-intent-shown')) {
        exitPopup.classList.add('show');
        sessionStorage.setItem('exit-intent-shown', 'true');
      }
    };

    const hidePopup = () => {
      exitPopup.classList.remove('show');
      if (input) input.value = '';
      if (msg) msg.textContent = '';
    };

    // Trigger on mouseleave from top of document
    document.addEventListener('mouseleave', (e) => {
      if (e.clientY < 20) {
        showPopup();
      }
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', hidePopup);
    }

    exitPopup.addEventListener('click', (e) => {
      if (e.target === exitPopup) {
        hidePopup();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && exitPopup.classList.contains('show')) {
        hidePopup();
      }
    });

    if (form && input && msg) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = input.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (!email) {
          msg.className = 'exit-popup-message error';
          msg.textContent = 'Email address is required';
          return;
        } else if (!emailRegex.test(email)) {
          msg.className = 'exit-popup-message error';
          msg.textContent = 'Please enter a valid email address';
          return;
        }

        const submitBtn = form.querySelector('.exit-popup-submit');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Subscribing...';
        submitBtn.disabled = true;

        fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({
            access_key: 'db47306b-6779-4d87-9279-d805de43c70c',
            subject: `Neptune Newsletter Subscription: ${email}`,
            email: email,
            form_name: 'Newsletter Subscription'
          })
        })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            msg.className = 'exit-popup-message success';
            msg.textContent = 'Thank you for subscribing!';
            setTimeout(hidePopup, 2000);
          } else {
            msg.className = 'exit-popup-message error';
            msg.textContent = 'Subscription failed. Please try again.';
          }
        })
        .catch(() => {
          msg.className = 'exit-popup-message error';
          msg.textContent = 'An error occurred. Please try again.';
        })
        .finally(() => {
          submitBtn.textContent = originalText;
          submitBtn.disabled = false;
        });
      });
    }
  }

})();
