const UPSTREAM_ORIGIN = 'https://wingedsaga.tail7db1c9.ts.net';
const ALLOWED_ORIGIN = 'https://news-seconds.duckdns.org';

function corsHeaders(request) {
  const headers = new Headers({
    'Access-Control-Allow-Methods': 'GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization,Content-Type',
    'Access-Control-Max-Age': '86400',
  });

  if (request.headers.get('Origin') === ALLOWED_ORIGIN) {
    headers.set('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
    headers.set('Vary', 'Origin');
  }
  return headers;
}

export async function onRequest(context) {
  const cors = corsHeaders(context.request);
  if (context.request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

  const incoming = new URL(context.request.url);
  const upstream = new URL(incoming.pathname + incoming.search, UPSTREAM_ORIGIN);
  const headers = new Headers(context.request.headers);
  headers.delete('Host');

  const response = await fetch(upstream, {
    method: context.request.method,
    headers,
    body: ['GET', 'HEAD'].includes(context.request.method) ? undefined : context.request.body,
    redirect: 'manual',
  });
  const responseHeaders = new Headers(response.headers);
  for (const [name, value] of cors) responseHeaders.set(name, value);
  return new Response(response.body, { status: response.status, headers: responseHeaders });
}
