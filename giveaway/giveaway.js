(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const config = window.GIVEAWAY_CONFIG || {};
  const requested = new URLSearchParams(location.search).get('event') || config.defaultEvent || '';
  const eventId = /^[a-z0-9][a-z0-9-]{0,79}$/.test(requested) ? requested : 'invalid';
  const form = $('entry-form');
  const button = $('submit');
  const label = 'Enter to win The Works';
  let event;
  let busy = false;
  const date = value => new Date(value).toLocaleString('en-US', {dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Chicago'}) + ' Central';
  const fail = message => { $('error').textContent = message; $('error').hidden = false; $('error').focus(); };
  const request = async (url, options, timeoutMs) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {...options, signal: controller.signal, headers: {'content-type': 'application/json'}});
      return await response.json();
    } finally { clearTimeout(timer); }
  };

  (async () => {
    const slow = setTimeout(() => { $('status').textContent = 'Event details are taking longer to load. If this continues, reload the page or ask us at the booth.'; }, 8000);
    try {
      event = await request('/api/giveaway/event?id=' + encodeURIComponent(eventId), {}, 20000);
      clearTimeout(slow);
      $('event-name').textContent = event.name || 'Event giveaway';
      $('event-timing').textContent = event.available ? 'Entries close ' + date(event.closesAt) + '. Drawing ' + date(event.drawAt) + '.' : '';
      $('status').textContent = event.message || '';
      if (!event.available) return;
      $('email-consent').textContent = event.emailConsent;
      $('sms-consent').textContent = event.smsConsent;
      $('eligibility').textContent = event.eligibility;
      $('dates').textContent = 'Entries close ' + date(event.closesAt) + '. Winner drawn ' + date(event.drawAt) + '.';
      $('rules-text').textContent = event.rules;
      form.hidden = false;
      button.disabled = false;
    } catch {
      clearTimeout(slow);
      $('status').textContent = 'We couldn’t load this drawing. Please reload the page, or ask us at the booth.';
    }
  })();

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!event || !event.available || busy || !form.reportValidity()) return;
    const payload = Object.fromEntries(new FormData(form));
    if (!/^(1)?[2-9][0-9]{2}[2-9][0-9]{6}$/.test(payload.phone.replace(/\D/g, ''))) { fail('Please enter a valid US mobile number, including the area code.'); $('phone').focus(); return; }
    payload.eventId = event.id;
    payload.token = event.token;
    payload.emailOptIn = $('email-opt-in').checked;
    payload.smsOptIn = $('sms-opt-in').checked;
    payload.rulesAccepted = $('rules-accepted').checked;
    busy = true; button.disabled = true; button.textContent = 'Saving your entry…'; form.setAttribute('aria-busy', 'true'); $('error').hidden = true;
    let result;
    try { result = await request('/api/giveaway/enter', {method: 'POST', body: JSON.stringify(payload)}, 30000); } catch { result = null; }
    busy = false; form.removeAttribute('aria-busy'); button.disabled = false;
    if (!result) { button.textContent = 'Try again'; fail('We couldn’t confirm your entry. Please try again, or ask us at the booth. Your details are still here, and retries won’t create extra entries.'); return; }
    if (!result.ok) { button.textContent = label; fail(result.message || 'We couldn’t confirm your entry. Please try again.'); return; }
    form.hidden = true; $('status').hidden = true;
    $('success-copy').textContent = 'Your entry for ' + event.name + ' is recorded. Thank you for stopping by.';
    $('success').hidden = false; $('success').focus();
    $('success').scrollIntoView({block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'});
  });
})();
