// Canonical-host redirect in front of the static assets.
// www.rvandrei.com (and any other non-canonical host) → 301 to https://rvandrei.com, keeping path + query.
const CANONICAL_HOST = 'rvandrei.com';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.hostname === `www.${CANONICAL_HOST}`) {
      url.hostname = CANONICAL_HOST;
      url.protocol = 'https:';
      return Response.redirect(url.toString(), 301);
    }
    return env.ASSETS.fetch(request);
  },
};
