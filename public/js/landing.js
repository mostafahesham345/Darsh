/* Darsh — landing page interactions
   ------------------------------------------------------------------
   - Nav scroll state
   - Mobile burger toggle
   - Cursor glow (desktop only)
   - IntersectionObserver scroll reveal
   - Animated KPI counters on reveal
   - Mock-window progress fills on reveal
   - Footer year
*/

(() => {
  const prefersReduced =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ----- Footer year ----- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ----- Nav scrolled ----- */
  const nav = document.getElementById('nav');
  const onScroll = () => {
    if (!nav) return;
    nav.classList.toggle('scrolled', window.scrollY > 24);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ----- Mobile burger ----- */
  const burger = document.getElementById('navBurger');
  const navLinks = document.getElementById('navLinks');
  if (burger && navLinks) {
    burger.addEventListener('click', () => {
      const open = navLinks.classList.toggle('open');
      burger.setAttribute('aria-expanded', String(open));
    });
    navLinks.querySelectorAll('a').forEach((a) =>
      a.addEventListener('click', () => {
        navLinks.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
      })
    );
  }

  /* ----- Cursor glow ----- */
  const glow = document.querySelector('.cursor-glow');
  const hasFinePointer =
    window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  if (glow && hasFinePointer && !prefersReduced) {
    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let curX = targetX;
    let curY = targetY;

    window.addEventListener(
      'pointermove',
      (e) => {
        targetX = e.clientX;
        targetY = e.clientY;
      },
      { passive: true }
    );

    const tick = () => {
      curX += (targetX - curX) * 0.12;
      curY += (targetY - curY) * 0.12;
      glow.style.transform = `translate3d(${curX}px, ${curY}px, 0)`;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  } else if (glow) {
    glow.style.display = 'none';
  }

  /* ----- KPI counters ----- */
  const animateCount = (el) => {
    const target = parseFloat(el.dataset.count || '0');
    const suffix = el.dataset.suffix || '';
    const duration = 1400;
    const start = performance.now();
    const from = 0;

    const step = (now) => {
      const t = Math.min((now - start) / duration, 1);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      const v = Math.round(from + (target - from) * eased);
      el.textContent = v + suffix;
      if (t < 1) requestAnimationFrame(step);
      else el.textContent = target + suffix;
    };
    requestAnimationFrame(step);
  };

  /* ----- Mock progress bars ----- */
  const fillProgress = (container) => {
    container.querySelectorAll('.mock-progress > div').forEach((bar, i) => {
      const target = bar.dataset.width || '60%';
      setTimeout(() => {
        bar.style.width = target;
      }, i * 140);
    });
  };

  /* ----- Scroll reveal ----- */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !prefersReduced) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          el.classList.add('visible');

          // KPI counter inside
          el.querySelectorAll('.kpi-value[data-count]').forEach((k) => {
            if (!k.dataset.counted) {
              k.dataset.counted = '1';
              animateCount(k);
            }
          });
          // Mock progress bars
          if (el.classList.contains('why-mock')) fillProgress(el);

          io.unobserve(el);
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    // Fallback — show everything immediately
    revealEls.forEach((el) => el.classList.add('visible'));
    document.querySelectorAll('.kpi-value[data-count]').forEach((k) => {
      k.textContent = k.dataset.count + (k.dataset.suffix || '');
    });
    document.querySelectorAll('.why-mock').forEach(fillProgress);
  }

  /* ----- Contact form (real submit) ----- */
  const form = document.getElementById('contactForm');
  if (form) {
    const submitBtn = document.getElementById('contactSubmit');
    const statusEl = document.getElementById('contactStatus');
    const label = submitBtn ? submitBtn.querySelector('.btn-label') : null;
    const defaultLabel = label ? label.textContent : 'Send message';

    const clearErrors = () => {
      form.querySelectorAll('.field-err').forEach((el) => (el.textContent = ''));
      form.querySelectorAll('.field.invalid').forEach((el) => el.classList.remove('invalid'));
    };
    const showError = (key, msg) => {
      const el = form.querySelector(`.field-err[data-err="${key}"]`);
      if (el) {
        el.textContent = msg;
        const field = el.closest('.field');
        if (field) field.classList.add('invalid');
      }
    };
    const setStatus = (msg, kind) => {
      if (!statusEl) return;
      statusEl.textContent = msg;
      statusEl.className = 'contact-status' + (kind ? ' ' + kind : '');
    };

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearErrors();
      setStatus('', '');

      const data = Object.fromEntries(new FormData(form).entries());

      if (submitBtn) submitBtn.disabled = true;
      if (label) label.textContent = 'Sending…';

      try {
        const res = await fetch('/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(data),
        });
        const json = await res.json().catch(() => ({}));

        if (res.ok && json.ok) {
          form.reset();
          if (label) label.textContent = '✓ Message sent';
          setStatus("Thanks — we'll be in touch within one business day.", 'success');
          setTimeout(() => {
            if (label) label.textContent = defaultLabel;
            if (submitBtn) submitBtn.disabled = false;
          }, 4000);
          return;
        }

        if (json.errors) {
          Object.entries(json.errors).forEach(([k, v]) => showError(k, v));
          setStatus('Please fix the highlighted fields.', 'error');
        } else {
          setStatus(json.error || 'Something went wrong. Please try again.', 'error');
        }
      } catch (_) {
        setStatus('Network error — please check your connection and try again.', 'error');
      }

      if (label) label.textContent = defaultLabel;
      if (submitBtn) submitBtn.disabled = false;
    });
  }

  /* ----- Subtle parallax on hero inner content ----- */
  const heroInner = document.querySelector('.hero-inner');
  if (heroInner && !prefersReduced) {
    let ticking = false;
    const update = () => {
      const y = Math.min(window.scrollY, 600);
      heroInner.style.transform = `translate3d(0, ${y * 0.12}px, 0)`;
      heroInner.style.opacity = String(Math.max(0, 1 - y / 550));
      ticking = false;
    };
    window.addEventListener(
      'scroll',
      () => {
        if (!ticking) {
          requestAnimationFrame(update);
          ticking = true;
        }
      },
      { passive: true }
    );
  }
})();
