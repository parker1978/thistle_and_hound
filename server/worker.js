// Cloudflare Worker entry point. /api/* requests run the giveaway API; everything else is the static site.
import {getEvent, submitEntry, listEvents, listEntrants, draw, exportEntries, route} from './giveaway.js';

const routes = {
  '/api/giveaway/event': {GET: getEvent},
  '/api/giveaway/enter': {POST: submitEntry},
  '/api/admin/events': {GET: listEvents},
  '/api/admin/entrants': {GET: listEntrants},
  '/api/admin/draw': {POST: draw},
  '/api/admin/export': {GET: exportEntries}
};
const error = (message, status, headers = {}) => new Response(JSON.stringify({ok: false, error: message, message}), {
  status, headers: {'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers}
});

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const methods = routes[url.pathname];
    if (methods) {
      const handler = methods[request.method];
      return handler ? route(handler)({request, env}) : error('Method not allowed.', 405, {allow: Object.keys(methods).join(', ')});
    }
    if (url.pathname.startsWith('/api/')) return error('Not found.', 404);
    return env.ASSETS.fetch(request);
  }
};
