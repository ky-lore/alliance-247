/* The Alliance 247 — homepage interactions */
(function () {
  'use strict';

  // Mobile nav
  var toggle = document.querySelector('.nav__toggle');
  var links = document.querySelector('.nav__links');
  var header = document.querySelector('.site-header');
  var isMobileNav = function () { return window.matchMedia('(max-width:900px)').matches; };

  function setNav(open) {
    links.classList.toggle('open', open);
    toggle.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.body.classList.toggle('nav-open', open);
    if (!open) {
      // reset the accordions so the drawer always reopens compact
      links.querySelectorAll('.has-dd.open').forEach(function (dd) { dd.classList.remove('open'); });
    }
  }

  if (toggle && links) {
    toggle.addEventListener('click', function (e) {
      e.stopPropagation();
      setNav(!links.classList.contains('open'));
    });

    links.addEventListener('click', function (e) {
      var a = e.target.closest('a');
      if (!a) return;
      var parent = a.parentElement;
      // tapping "Services" opens the accordion instead of navigating
      if (isMobileNav() && parent && parent.classList.contains('has-dd')) {
        e.preventDefault();
        parent.classList.toggle('open');
        return;
      }
      if (links.classList.contains('open')) setNav(false);
    });

    // tap outside / Escape closes it
    document.addEventListener('click', function (e) {
      if (links.classList.contains('open') && header && !header.contains(e.target)) setNav(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && links.classList.contains('open')) { setNav(false); toggle.focus(); }
    });
    window.addEventListener('resize', function () {
      if (!isMobileNav() && links.classList.contains('open')) setNav(false);
    });
  }

  // Scroll reveal
  var revealables = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealables.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealables.forEach(function (el, i) {
      el.style.transitionDelay = (i % 3) * 90 + 'ms';
      io.observe(el);
    });
  } else {
    revealables.forEach(function (el) { el.classList.add('in'); });
  }

  // Placeholder form handling
  document.querySelectorAll('form[data-placeholder]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = form.querySelector('[type="submit"]');
      var original = btn ? btn.textContent : '';
      if (btn) { btn.textContent = 'Request sent ✓'; btn.disabled = true; }
      form.reset();
      setTimeout(function () {
        if (btn) { btn.textContent = original; btn.disabled = false; }
      }, 3200);
    });
  });

  // Footer year
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();
