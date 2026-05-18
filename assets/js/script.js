(function () {
  'use strict';

  const header = document.getElementById('tmy-header');
  const burger = document.getElementById('tmy-burger');
  const side = document.querySelector('.tmy-side');
  const year = document.getElementById('tmy-year');
  const form = document.getElementById('contact-form');

  if (year) year.textContent = new Date().getFullYear();

  // Header scroll state + side CTA visibility
  const onScroll = () => {
    const y = window.scrollY;
    if (header) header.classList.toggle('is-scrolled', y > 40);
    if (side) side.classList.toggle('is-visible', y > 600);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Burger toggle
  if (burger) {
    burger.addEventListener('click', () => {
      const open = header.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', String(open));
    });
    header.querySelectorAll('.tmy-header__nav a').forEach(a => {
      a.addEventListener('click', () => {
        header.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Smooth scroll for in-page anchors with header offset
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (!id || id === '#' || id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const headerH = header ? header.offsetHeight : 0;
      const top = target.getBoundingClientRect().top + window.scrollY - headerH - 12;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  // Reveal on scroll
  const revealTargets = document.querySelectorAll(
    '.tmy-card, .tmy-step, .tmy-product, .tmy-voice, .tmy-sustain__card, .tmy-faq__item, .tmy-concerns__list li, .tmy-stats__item, .tmy-contact__card'
  );
  revealTargets.forEach(el => el.classList.add('tmy-reveal'));
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          en.target.classList.add('is-in');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealTargets.forEach(el => io.observe(el));
  } else {
    revealTargets.forEach(el => el.classList.add('is-in'));
  }

  // Modal (privacy policy etc.) — hidden by default, opened via [data-modal-open]
  (function () {
    let lastFocused = null;

    const openModal = (modal, trigger) => {
      if (!modal) return;
      lastFocused = trigger || document.activeElement;
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('tmy-modal-open');
      const closeBtn = modal.querySelector('[data-modal-close]');
      if (closeBtn) closeBtn.focus();
    };

    const closeModal = (modal) => {
      if (!modal) return;
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('tmy-modal-open');
      if (lastFocused && typeof lastFocused.focus === 'function') {
        lastFocused.focus();
      }
      lastFocused = null;
    };

    document.querySelectorAll('[data-modal-open]').forEach(trigger => {
      trigger.addEventListener('click', () => {
        const modal = document.getElementById(trigger.getAttribute('data-modal-open'));
        openModal(modal, trigger);
      });
    });

    document.querySelectorAll('[data-modal-close]').forEach(el => {
      el.addEventListener('click', () => {
        closeModal(el.closest('.tmy-modal'));
      });
    });

    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      const open = document.querySelector('.tmy-modal.is-open');
      if (open) closeModal(open);
    });
  })();

  // Swap the message placeholder based on the selected inquiry type
  if (form) {
    const message = form.querySelector('#f-message');
    const typeRadios = form.querySelectorAll('input[name="type"]');
    const placeholders = {
      contact: '例：工場作業員200名分の作業服を刷新したい。夏場の熱中症対策も検討中。',
      doc: '例：作業服・安全保護具のカタログと価格表を希望。製造業向けの導入事例集もあれば送付してほしい。',
      estimate: '例：オリジナル刺繍入りの作業服を50着、9月までに納品希望。素材や概算費用も相談したい。'
    };
    const syncPlaceholder = () => {
      const checked = form.querySelector('input[name="type"]:checked');
      const key = checked ? checked.value : 'contact';
      if (message && placeholders[key]) message.placeholder = placeholders[key];
    };
    typeRadios.forEach(r => r.addEventListener('change', syncPlaceholder));
    syncPlaceholder();
  }

  // Simple form validation (the real submission will be handled by WP plugin such as Contact Form 7 / WPForms)
  if (form) {
    form.addEventListener('submit', (e) => {
      let ok = true;
      form.querySelectorAll('[required]').forEach(field => {
        const val = (field.value || '').trim();
        const isCheckbox = field.type === 'checkbox';
        const invalid = isCheckbox ? !field.checked : !val;
        field.classList.toggle('is-invalid', invalid);
        if (invalid) ok = false;
      });
      const email = form.querySelector('#f-email');
      if (email && email.value && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.value)) {
        email.classList.add('is-invalid');
        ok = false;
      }
      if (!ok) {
        e.preventDefault();
        const firstInvalid = form.querySelector('.is-invalid');
        if (firstInvalid) firstInvalid.focus({ preventScroll: false });
      }
    });
    form.querySelectorAll('input, textarea').forEach(el => {
      el.addEventListener('input', () => el.classList.remove('is-invalid'));
    });
  }
})();
