# 🌐 Ben Ghosti — IT Portfolio & Hub

<p align="center">
  <img src="https://img.shields.io/badge/System_Status-Operational-brightgreen?style=for-the-badge&logo=uptime-kuma&logoColor=white" alt="System Status">
  <img src="https://img.shields.io/badge/Environment-Production-orange?style=for-the-badge&logo=unraid&logoColor=white" alt="Environment">
  <img src="https://img.shields.io/badge/Location-Germany-blue?style=for-the-badge" alt="Location">
</p>

> **"IT isn't work — it's a mindset."**  
> Living record of hardware engineering, home lab infrastructure, and digital craftsmanship. Built by curiosity. Maintained with discipline. No clients. No agency. Just signal.

---

## 🛠️ Core Disciplines

*   **Hardware Engineering & Tuning:** High-end system integration, custom loop thermal mapping, and precision per-core undervolting for maximum thermal efficiency.
*   **Infrastructure & Home Lab:** Orchestrating resilient self-hosted environments across **Unraid** and **Proxmox** stacks with a heavy focus on data redundancy and container containerization.
*   **Full-Stack Development:** Crafting lightweight, SEO-ready web architectural solutions focusing on modern web standards, performance optimization, and clean deployment pipelines.

---

## 📂 Web Ecosystem & Sub-Pages

This repository contains the complete source code for [ben-ghosti.de](https://ben-ghosti.de/) along with its newly integrated subsystems:

| Component / Sub-Page | Route | Description | Status |
| :--- | :--- | :--- | :--- |
| **🌐 Central Hub** | `/index.html` | Core landing page displaying skills, custom workstation builds, and link matrix. | Live |
| **🤝 Supporters** | `/sponsors.html` | Overview of hardware suppliers, software partners, and infrastructure supporters. | Live |
| **📈 System Status** | `/status.html` | Real-time health monitoring of local storage layers and self-hosted environments. | Live |
| **🎮 Benpixel** | `/benpixel/` | Seasonal Minecraft server page with live status, season metadata, countdown, and join instructions. | New |

---

## 🎛️ Infrastructure Monitoring (Self-Hosted Stacks)

The integrated system status dashboard aggregates availability data directly from the local environment:
*   🟢 **Home Lab Storage Layer** — *Online (Unraid Array)*
*   🟢 **Proxmox Hypervisor Class** — *Online (Compute Nodes)*
*   🟢 **Paperless-ngx** — *Online (Document Management DMS)*
*   🟢 **Backup Integrity** — *Healthy (Automated Redundancy)*

---

## 📁 Repository Structure

```text
.
├── assets/                 # Global UI assets & dependencies
│   ├── css/                # Optimized stylesheets (style.css, fonts.css)
│   ├── fonts/              # Locally hosted performance-optimized webfonts
│   ├── images/             # Compressed image assets (Glacier Workstation, server racks)
│   └── js/                 # Pure Vanilla JavaScript framework (main.js)
├── benpixel/               # Sub-Directory: Seasonal Minecraft server page
│   ├── index.html          # Benpixel landing page
│   ├── season.json         # Season metadata (edit per season)
│   ├── rules.pdf           # Current server rules (replace per update)
│   └── assets/             # Page-specific CSS, JS, and images
├── index.html              # Main entry point & production hub
├── status.html             # System status portal
├── sponsors.html           # Supporters index
└── README.md               # System documentation


```

### Benpixel season updates

The season number, Minecraft version, and maintenance state are read live from the server MOTD:

* `Season 9` → season number `9`
* `26.1-26.1.2` or `26.1.2` → Minecraft version (ranges are shown as `26.1 – 26.1.2`)
* a MOTD containing `maint` (case-insensitive) → maintenance state
* the software (Paper, Fabric, …) is no longer displayed

The season number is cached in the browser, so it stays visible when the server is offline.

[`benpixel/season.json`](benpixel/season.json) still holds the editorial data:

* `state` — `auto` follows the live server, `offline` forces the off-season view, `maintenance` forces the maintenance view.
* `start`, `end` — the season window. If the server is offline inside this window, the page shows **Currently offline**; outside it shows **Off-Season**. Dates use `YYYY-MM-DD`.
* `nextStart` — used for the off-season countdown.
* `description`, `highlights`, `archive` — visible content.
* `discord` — Discord invite URL for the Join button. Leave empty to link to the contact hub.
* `history` — timeline entries (`date`, `badge`, `title`, `body`, `tags`, optional `highlight`). The History section renders them; `highlight: true` marks the latest chapter.
* `whitelist` — controls the whitelist form.

The page reads the Minecraft status live from `benpixel.ben-ghosti.de` via `api.mcsrvstat.us` (with `api.mcstatus.io` as fallback).

### Benpixel rules & agreement

* The current ruleset lives at [`benpixel/rules.pdf`](benpixel/rules.pdf). Replace it whenever the rules change.
* The page opens it in a modal PDF viewer with an "open in new tab" fallback.
* The server address stays blurred and the copy button stays disabled until the visitor accepts the rules.
* The agreement is stored in the browser (`localStorage`) and tied to the rules version.
* When the PDF changes, bump `RULES.version` in [`benpixel/assets/js/benpixel.js`](benpixel/assets/js/benpixel.js) so returning visitors have to agree again.

### Benpixel whitelist

* Requests are controlled by [`benpixel/season.json`](benpixel/season.json): set `whitelist.open` to `true` and adjust `whitelist.message`.
* The form appears only when the flag is open **and** both `CONFIG.whitelist.endpoint` and `CONFIG.whitelist.turnstileSiteKey` are configured in `benpixel/assets/js/benpixel.js`.
* The frontend posts `{ username, discord, rulesVersion, turnstileToken }` to the configured endpoint.
* The planned backend is a Cloudflare Worker that verifies Turnstile, resolves the Mojang UUID, logs IP/User-Agent for abuse prevention, stores the request, and forwards it to Discord. The Worker is intentionally not included yet; the approval flow and retention policy are still open.

---

## 📡 Signal & Exchange

Web: ben-ghosti.de
Mail: info@ben-ghosti.de
Instagram: @ben_ghosti
Discord: Ben_Ghosti (Open for technical exchange and lab discussions)

---

## ⚖️License

This repository is **source-available, not open source**. It is licensed under the [PolyForm Strict License 1.0.0](LICENSE).

You may view the source and use it for noncommercial purposes. You may **not** modify it or distribute it. Public hosting, deployment, or making the code available as a website is distribution and is not permitted. For permission, contact info@ben-ghosti.de.

GitHub's viewing and forking features are provided under GitHub's Terms of Service. A fork does not grant any right to use, modify, distribute, or host this code; any fork remains subject to this license.

Third-party components are listed in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

© 2026 BenGhosti. All rights reserved.

---

## Performance & Cloudflare

The production site is served through Cloudflare. The repo ships a [`_headers`](_headers) file for Cloudflare Pages/Netlify; if the origin is GitHub Pages behind Cloudflare, add a **Cache Rule** instead. Cloudflare Web Analytics is enabled for cookieless, aggregate traffic measurement (no analytics cookies, no cross-site profiles); the privacy disclosure is in [`legal.html`](legal.html). Two things matter for repeat visits and Lighthouse:

### Static asset caching

Static hosts often send a short `Cache-Control` for static files. The `_headers` file uses a one-year cache for CSS/JS/fonts and a 30-day cache for images. For a Cloudflare proxy setup, add a **Cache Rule**:

* `/assets/css/*`, `/assets/js/*`, `/assets/fonts/*`, `/benpixel/assets/css/*`, `/benpixel/assets/js/*`, `/benpixel/assets/fonts/*`: Edge TTL **1 year**, Browser TTL **1 year**
* `/assets/images/*`, `/benpixel/assets/images/*`: Edge TTL **30 days**, Browser TTL **30 days**
* Cache eligibility: **Eligible**

For an Nginx origin, keep HTML short-lived and split the asset TTLs:

```nginx
location ~* \.(?:css|js|woff2)$ {
  expires 1y;
  add_header Cache-Control "public, immutable";
}

location ~* \.(?:jpe?g|png|webp|avif)$ {
  expires 30d;
  add_header Cache-Control "public";
}
```

CSS and JavaScript references use `?v=YYYYMMDD-N` cache-busting query strings. Image filenames stay stable and use the 30-day cache; purge those URLs in Cloudflare when an image changes.

### Cloudflare-injected scripts

If Lighthouse reports large JavaScript bundles, `cdn-cgi/challenge-platform`, `email-decode.min.js`, `cloudflareinsights.com`, or deprecated APIs such as `StorageType.persistent`, these are **injected by Cloudflare, not by this repository**. To remove them:

* Disable **Bot Fight Mode / Super Bot Fight Mode** (or add a WAF skip rule for normal page views). This removes the challenge-platform JavaScript and the largest main-thread cost.
* Disable **Email Address Obfuscation** if the email-decode script is not needed.
* Disable **Web Analytics** if the Cloudflare Insights beacon is not needed.

The page code itself only loads `assets/js/main.js` and, on Benpixel, `benpixel/assets/js/benpixel.js`.

### Images

The hero and project images are shipped as WebP with optimized JPEG fallbacks. The main hero is about 45 KiB WebP / 99 KiB JPEG; Benpixel's hero is about 37 KiB WebP / 109 KiB JPEG.

