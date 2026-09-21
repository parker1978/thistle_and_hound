(() => {
  'use strict';
  const config = window.GIVEAWAY_CONFIG || {};
  const eventId = new URLSearchParams(location.search).get('event') || config.defaultEvent || '';
  const frame = document.getElementById('entry-frame');
  const bridge = crypto.randomUUID();
  frame.src = '../google-apps-script/Form.html?bridge=' + bridge;
  window.addEventListener('message', message => {
    const allowedOrigin = message.origin === location.origin || /^https:\/\/(?:[a-z0-9-]+\.)+googleusercontent\.com$/.test(message.origin);
    if (!allowedOrigin || !message.data || message.data.bridge !== bridge || message.data.type !== 'giveaway-height') return;
    const height = Number(message.data.height);
    if (Number.isFinite(height)) frame.height = String(Math.max(300, Math.min(2800, height)));
  });
  if (!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(config.formUrl || '')) return;
  const url = new URL(config.formUrl);
  url.searchParams.set('event', /^[a-z0-9][a-z0-9-]{0,79}$/.test(eventId) ? eventId : 'invalid');
  url.searchParams.set('bridge', bridge);
  frame.src = url.href;
  document.getElementById('direct-link').href = url.href;
  document.getElementById('frame-help').hidden = false;
})();
