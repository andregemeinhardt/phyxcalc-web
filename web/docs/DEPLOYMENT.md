# Deployment & Operations Guide

PhyxCalc Web is a static Progressive Web Application. It requires no application server or runtime database backend and can be hosted on any static file host or CDN.

---

## 1. Prerequisites & Hosting Requirements

1. **HTTPS Protocol**:
   * Modern browsers require HTTPS (or `http://localhost` for development) for:
     * Service Worker registration (`sw.js`)
     * Web App Manifest installation (`manifest.json`)
     * Direct File System Access API (`showOpenFilePicker`, `showSaveFilePicker`)
     * Persistent Storage API (`navigator.storage.persist`)
2. **Static Web Server**:
   * Any static CDN or web server (Vercel, Netlify, Cloudflare Pages, GitHub Pages, Firebase Hosting, Nginx, Caddy, Apache).

---

## 2. Recommended Caching Headers

To guarantee reliable Service Worker updates while maximizing offline performance:

| File / Pattern | Cache-Control Header | Rationale |
| :--- | :--- | :--- |
| `/index.html` | `no-cache, no-store, must-revalidate` | Ensures browser checks for latest app version entry point |
| `/sw.js` | `no-cache, no-store, must-revalidate` | Allows immediate discovery of Service Worker updates |
| `/manifest.json` | `max-age=86400` (1 day) | Infrequently modified metadata |
| `/assets/*` | `public, max-age=31536000, immutable` | Content-hashed files; safe for permanent caching |
| `/icon.svg` | `public, max-age=604800` (7 days) | Application icon asset |

### Example Nginx Configuration

```nginx
server {
    listen 443 ssl http2;
    server_name phyxcalc.example.com;
    root /var/www/phyxcalc-web/dist;
    index index.html;

    # HTML & Service Worker: Always revalidate
    location ~* ^/(index\.html|sw\.js)$ {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' blob:; worker-src 'self' blob:; object-src 'none'; base-uri 'self';";
    }

    # Hashed static assets: Cache permanently
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # Single Page App fallback
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## 3. Safe Rollback & Update Procedures

* **Rolling Forward**: Deploying a new build with an incremented service worker cache name (`phyxcalc-v1.x.x`) activates background fetching. The top update banner prompts the user to reload when ready.
* **Emergency Rollback**: Deploy the previous build assets. Because `/sw.js` is set to `must-revalidate`, clients will detect the change on next visit or navigation and install the previous stable version.
