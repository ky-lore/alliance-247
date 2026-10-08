/* The Alliance 247: landing page interactions (www.alliance247.com) */
(function () {
  'use strict';

  // Lead form endpoint (GoHighLevel inbound webhook, Zapier, etc.).
  // Leave empty until wired up: the form will show an error instead of pretending to send.
  var LEAD_WEBHOOK_URL = '';

  var COUNTIES = {
    'los-angeles': 'Los Angeles County',
    'orange': 'Orange County',
    'riverside': 'Riverside County',
    'san-bernardino': 'San Bernardino County'
  };
  var ALIASES = { la: 'los-angeles', oc: 'orange', sb: 'san-bernardino' };

  var params = new URLSearchParams(window.location.search);

  // ?area=orange (or la / oc / riverside / san-bernardino / sb) swaps the area text for ad-group matching
  var areaKey = (params.get('area') || '').toLowerCase().replace(/-county$/, '');
  areaKey = ALIASES[areaKey] || areaKey;
  var area = COUNTIES[areaKey];
  if (area) {
    document.querySelectorAll('[data-area]').forEach(function (el) { el.textContent = area; });
    var county = document.querySelector('.county[data-county="' + areaKey + '"]');
    if (county) county.classList.add('is-active');
  }

  // Scroll reveal
  var revealables = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealables.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealables.forEach(function (el, i) {
      el.style.transitionDelay = (i % 3) * 90 + 'ms';
      io.observe(el);
    });
  } else {
    revealables.forEach(function (el) { el.classList.add('in'); });
  }

  // Lead forms: attach tracking fields, post to webhook
  var TRACK = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'gbraid', 'wbraid', 'fbclid', 'msclkid'];
  document.querySelectorAll('form.lead-form').forEach(function (form) {
    var card = form.closest('.hero__card');
    var err = form.querySelector('.form-error');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (err) err.classList.remove('show');

      var data = {};
      new FormData(form).forEach(function (v, k) { data[k] = v; });
      TRACK.forEach(function (k) { if (params.get(k)) data[k] = params.get(k); });
      data.area = area || '';
      data.landing_page = window.location.origin + window.location.pathname;
      data.referrer = document.referrer || '';
      data.submitted_at = new Date().toISOString();

      var btn = form.querySelector('[type="submit"]');
      var original = btn ? btn.textContent : '';

      function fail() {
        if (btn) { btn.textContent = original; btn.disabled = false; }
        if (err) err.classList.add('show');
      }

      if (!LEAD_WEBHOOK_URL) { console.warn('[lp] LEAD_WEBHOOK_URL is not set: lead not sent', data); fail(); return; }

      if (btn) { btn.textContent = 'Sending…'; btn.disabled = true; }
      fetch(LEAD_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({ event: 'generate_lead', lead_service: data.service || '', lead_page: data.page || '' });
        if (card) card.classList.add('is-sent');
      }).catch(fail);
    });
  });

  // Phone click tracking
  document.querySelectorAll('a[href^="tel:"]').forEach(function (a) {
    a.addEventListener('click', function () {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: 'phone_click', lead_page: window.location.pathname });
    });
  });

  // Footer year
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();
