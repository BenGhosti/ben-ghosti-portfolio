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
| **🎓 School Stuff** | `/school/` | Integrated document management, custom stylesheets, and structured digital school notes. | New |
| **🤝 Sponsors** | `/sponsors.html` | Overview of hardware suppliers, software partners, and infrastructure supporters. | Live |
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
├── school/                 # Sub-Directory: Academic document repository
│   ├── style.css           # Custom school layout styling
│   └── math.html           # Embedded math & documentation stack
├── benpixel/               # Sub-Directory: Seasonal Minecraft server page
│   ├── index.html          # Benpixel landing page
│   ├── season.json         # Season metadata (edit per season)
│   └── assets/             # Page-specific CSS, JS, and images
├── index.html              # Main entry point & production hub
├── status.html             # System status portal
├── sponsors.html           # Partner index
└── README.md               # System documentation


```

### Benpixel season updates

Edit [`benpixel/season.json`](benpixel/season.json) when a season starts or ends:

* `state` — `auto` follows the live server, `offline` forces the off-season view, `maintenance` forces the maintenance view.
* `number`, `name`, `start`, `end`, `nextStart` — season metadata and countdown. Dates use `YYYY-MM-DD`; leave empty if unknown.
* `highlights` — cards shown next to the season summary.
* `archive` — optional list of past seasons (`name` / `period` / `note`).

The page reads the Minecraft status live from `benpixel.ben-ghosti.de` via `api.mcsrvstat.us` (with `api.mcstatus.io` as fallback).

---

## 📡 Signal & Exchange

Web: ben-ghosti.de
Mail: info@ben-ghosti.de
Instagram: @ben_ghosti
Discord: Ben_Ghosti (Open for technical exchange and lab discussions)

---

## ⚖️License

© 2026 BenGhosti. All rights reserved.
