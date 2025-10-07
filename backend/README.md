IP Tracking Backend (Express + MongoDB)

Prerequisites
- Node.js 18+
- MongoDB running locally at `mongodb://localhost:27017/`

Setup
1) Install deps
   - `npm install`
2) Configure environment
   - Copy `.env.example` to `.env` and adjust if needed
3) Start server
   - Dev: `npm run dev`
   - Prod: `npm start`

Default config
- PORT: 4000
- DB: `visitsdb` under `mongodb://localhost:27017/`

Endpoints
- GET `/health` → `{ ok: true }`
- POST `/api/track` → `{ saved: true }` when successful

What gets stored
- `ipAddress`: derived from `x-forwarded-for`, `remoteAddress`, or `req.ip`
- `path`: from body `path` or query `path`
- `userAgent`: request `user-agent` header
- `referer`: `referer`/`referrer` header

Client snippet (add to your landing page)
```html
<script>
  (function(){
    var endpoint = 'http://localhost:4000/api/track';
    var path = window.location.pathname + window.location.search;
    try {
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: path })
      });
    } catch (e) { /* ignore */ }
  })();
</script>
```

If your site is behind a proxy/CDN, ensure it forwards the `x-forwarded-for` header so the server can capture the client IP. For the provided landing page (`https://nexti18n.netlify.app/`), place the snippet where the HTML is served, or add it to your framework layout template.


