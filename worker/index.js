// Canonical-origin redirect in front of the static assets.
// http://… and www.rvandrei.com → 301 to https://rvandrei.com, keeping path + query.
const CANONICAL_HOST = 'rvandrei.com';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const isProdHost = url.hostname === CANONICAL_HOST || url.hostname === `www.${CANONICAL_HOST}`;
    if (isProdHost && (url.hostname !== CANONICAL_HOST || url.protocol !== 'https:')) {
      url.hostname = CANONICAL_HOST;
      url.protocol = 'https:';
      return Response.redirect(url.toString(), 301);
    }
    return env.ASSETS.fetch(request);
  },
};
