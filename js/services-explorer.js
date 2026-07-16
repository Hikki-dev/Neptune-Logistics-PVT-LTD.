/**
 * Neptune Logistics Services Explorer Modal Control
 * Provides interactive greeting and direct routing capability.
 */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    const trigger = document.getElementById('explore-services-trigger');
    const modal = document.getElementById('services-explorer-modal');
    
    if (!trigger || !modal) return;
    
    const closeBtn = modal.querySelector('.services-explorer-close');
    const cards = modal.querySelectorAll('.services-explorer-card');
    let previousFocusElement = null;

    function showModal() {
      previousFocusElement = document.activeElement;
      modal.classList.add('show');
      modal.setAttribute('aria-hidden', 'false');
      trigger.setAttribute('aria-expanded', 'true');
      
      // Focus on the first card for immediate keyboard support
      if (cards.length > 0) {
        setTimeout(function () {
          cards[0].focus();
        }, 100);
      }
      
      // Stop page scrolling behind overlay
      document.body.style.overflow = 'hidden';
    }

    function hideModal() {
      modal.classList.remove('show');
      modal.setAttribute('aria-hidden', 'true');
      trigger.setAttribute('aria-expanded', 'false');
      
      // Restore previous scrolling behavior
      document.body.style.overflow = '';
      
      // Restore focus to trigger button
      if (previousFocusElement) {
        previousFocusElement.focus();
      }
    }

    // Toggle Modal on Main Button Click
    trigger.addEventListener('click', function (e) {
      e.preventDefault();
      showModal();
    });

    // Close button click
    if (closeBtn) {
      closeBtn.addEventListener('click', function (e) {
        e.preventDefault();
        hideModal();
      });
    }

    // Close on clicking backdrop
    modal.addEventListener('click', function (e) {
      if (e.target === modal) {
        hideModal();
      }
    });

    // Keyboard controls
    document.addEventListener('keydown', function (e) {
      if (!modal.classList.contains('show')) return;

      // Escape key closes modal
      if (e.key === 'Escape') {
        hideModal();
        return;
      }

      // Tab key traps focus
      if (e.key === 'Tab') {
        const focusable = modal.querySelectorAll('a, button');
        if (focusable.length === 0) return;
        
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    });
  });
})();
