/**
 * Temporary public gateway used during the migration to the HomeLab.
 *
 * Cloudflare Tunnel forwards all HTTPS requests here, while the three
 * applications themselves run on the HomeLab. The path prefix selects an API
 * and is removed
 * before the request reaches that API:
 *   /api/...          -> News Seconds (4000)
 *   /messages/api/... -> Messages Seconds (4100)
 *   /food/api/...     -> Food Seconds (4200)
 */
const http = require('node:http');

const PORT = Number(process.env.PORT || 4300);
const targets = [
  { prefix: '/messages', port: 4100 },
  { prefix: '/food', port: 4200 },
  { prefix: '', port: 4000 },
];

function selectTarget(url) {
  return targets.find((target) => url === target.prefix || url.startsWith(`${target.prefix}/`));
}

const server = http.createServer((request, response) => {
  const target = selectTarget(request.url || '/');
  if (!target) {
    response.writeHead(404, { 'content-type': 'application/json; charset=utf-8' });
    response.end(JSON.stringify({ message: 'Маршрут не найден' }));
    return;
  }

  const suffix = target.prefix && request.url.startsWith(target.prefix)
    ? request.url.slice(target.prefix.length) || '/'
    : request.url || '/';
  const headers = { ...request.headers, host: `127.0.0.1:${target.port}` };
  headers['x-forwarded-for'] = request.socket.remoteAddress || '';
  headers['x-forwarded-proto'] = 'https';

  const upstream = http.request({
    host: '127.0.0.1',
    port: target.port,
    method: request.method,
    path: suffix,
    headers,
  }, (upstreamResponse) => {
    response.writeHead(upstreamResponse.statusCode || 502, upstreamResponse.headers);
    upstreamResponse.pipe(response);
  });

  upstream.on('error', () => {
    if (!response.headersSent) {
      response.writeHead(502, { 'content-type': 'application/json; charset=utf-8' });
    }
    response.end(JSON.stringify({ message: 'Сервис временно недоступен' }));
  });
  request.pipe(upstream);
});

// The Cloudflare connector runs on this same machine. Keep the gateway local
// so that no device on the home network can call the APIs directly.
server.listen(PORT, '127.0.0.1', () => {
  console.log(`HomeLab edge router is listening on ${PORT}`);
});
