# News Seconds API proxy

This Worker proxies only `/api/*` requests to the Raspberry Pi Tailscale Funnel.
It is intentionally not an open proxy and returns CORS headers only for
`https://news-seconds.duckdns.org`.

Deploy after authenticating Wrangler:

```bash
npm install
npm run deploy
```

Use the resulting `https://<worker>.<account>.workers.dev/api` address as the
GitHub Actions variable `VITE_API_URL`.
