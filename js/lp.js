/* The Alliance 247: landing page interactions (www.alliance247.com) */
(function () {
  'use strict';

  // Lead form endpoint: GoHighLevel inbound webhook (posted directly from the browser).
  var LEAD_WEBHOOK_URL = 'https://services.leadconnectorhq.com/hooks/aDPYDpN4kvtifRTOby7i/webhook-trigger/358552dd-add6-4a2e-a8a9-e9bc08dd6c74';

  // After a successful submit, send the visitor to their trade's thank-you page.
  var THANK_YOU = { Plumbing: '/thank-you-plumbing/', Electrical: '/thank-you-electrical/' };

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
  function toE164(raw) {
    var d = String(raw || '').replace(/\D/g, '');
    if (d.length === 10) return '+1' + d;
    if (d.length === 11 && d[0] === '1') return '+' + d;
    return String(raw || '').trim();
  }

  var TRACK = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'gbraid', 'wbraid', 'fbclid', 'msclkid'];
  document.querySelectorAll('form.lead-form').forEach(function (form) {
    var card = form.closest('.hero__card');
    var err = form.querySelector('.form-error');
    var busy = false;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (busy) return;
      if (err) err.classList.remove('show');

      // Honeypot: humans never see this field, bots fill it. Pretend success, send nothing.
      var hp = form.querySelector('input[name="website"]');
      if (hp && hp.value.trim()) { if (card) card.classList.add('is-sent'); return; }

      var data = {};
      new FormData(form).forEach(function (v, k) {
        if (k === 'website') return;
        data[k] = typeof v === 'string' ? v.trim() : v;
      });
      var parts = (data.name || '').split(/\s+/).filter(Boolean);
      data.full_name = data.name || '';
      data.first_name = parts.shift() || '';
      data.last_name = parts.join(' ');
      data.phone = toE164(data.phone);
      data.source = 'Website';
      data.form_source = 'Landing Page: ' + (data.page || '');
      data.page_url = window.location.href.split('#')[0];
      TRACK.forEach(function (k) { if (params.get(k)) data[k] = params.get(k); });
      data.area = area || '';
      data.landing_page = window.location.origin + window.location.pathname;
      data.referrer = document.referrer || '';
      data.submitted_at = new Date().toISOString();

      var btn = form.querySelector('[type="submit"]');
      var original = btn ? btn.textContent : '';

      function fail() {
        busy = false;
        if (btn) { btn.textContent = original; btn.disabled = false; }
        if (err) err.classList.add('show');
      }

      if (!LEAD_WEBHOOK_URL) { console.warn('[lp] LEAD_WEBHOOK_URL is not set: lead not sent', data); fail(); return; }

      busy = true;
      if (btn) { btn.textContent = 'Sending…'; btn.disabled = true; }
      fetch(LEAD_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data)
      }).then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        var thanks = THANK_YOU[data.trade];
        var done = false;
        function next() {
          if (done) return;
          done = true;
          if (thanks) window.location.href = thanks;
          else if (card) card.classList.add('is-sent');
        }
        // Let GTM fire its generate_lead tags before leaving the page, but never wait more than 1s.
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({ event: 'generate_lead', lead_service: data.service || '', lead_page: data.page || '', lead_trade: data.trade || '', eventCallback: next, eventTimeout: 1000 });
        setTimeout(next, 1200);
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
