function corsHeaders(request, env) {
  const origin = request.headers.get('Origin');
  const headers = new Headers();

  if (origin === env.ALLOWED_ORIGIN) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Vary', 'Origin');
  }

  headers.set('Access-Control-Allow-Methods', 'GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Authorization,Content-Type');
  headers.set('Access-Control-Allow-Credentials', 'false');
  headers.set('Access-Control-Max-Age', '86400');
  return headers;
}

export default {
  async fetch(request, env) {
    const cors = corsHeaders(request, env);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    const incomingUrl = new URL(request.url);
    if (!incomingUrl.pathname.startsWith('/api/')) {
      return new Response('Not found', { status: 404, headers: cors });
    }

    const upstreamUrl = new URL(incomingUrl.pathname + incomingUrl.search, env.UPSTREAM_ORIGIN);
    const headers = new Headers(request.headers);
    headers.delete('Host');

    const upstreamResponse = await fetch(upstreamUrl, {
      method: request.method,
      headers,
      body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
      redirect: 'manual',
    });

    const responseHeaders = new Headers(upstreamResponse.headers);
    for (const [name, value] of cors) responseHeaders.set(name, value);

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: responseHeaders,
    });
  },
};
