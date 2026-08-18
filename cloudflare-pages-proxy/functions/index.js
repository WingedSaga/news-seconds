const PUBLIC_SITE_URL = 'https://news-seconds.duckdns.org/';

export function onRequest() {
  return new Response(null, {
    status: 302,
    headers: {
      Location: PUBLIC_SITE_URL,
      'Cache-Control': 'no-store',
    },
  });
}
