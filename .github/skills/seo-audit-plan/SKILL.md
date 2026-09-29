---
name: seo-audit-plan
description: "Run seomator audit https://kritzel.io/ and turn Kritzel website SEO audit findings into a prioritized, evidence-based improvement plan. Use when asked for an SEO audit, SEO checks, indexing diagnosis, or a plan to improve kritzel.io search visibility."
argument-hint: "Optional: include Search Console warnings or example URLs to investigate"
---

# Kritzel SEO Audit Plan

Use this skill to propose changes, not to implement them unless explicitly requested.

1. From the repository root, run `seomator audit https://kritzel.io/`. If the CLI is unavailable or the audit fails, report the failure; do not invent results. Capture the score, page count, category breakdown, and each issue's ID, severity, affected URL, and evidence. Do not commit generated audit artifacts.
2. Treat the default audit as a single-page snapshot, not a site-wide indexability assessment. If a finding needs a link graph, duplicate-content comparison, or per-page crawl state, check `seomator audit --help` for a supported crawl option before running a bounded crawl. State explicitly when the larger check was not performed. Consult Search Console's exact exclusion reason and example URLs if supplied; a local audit cannot see Google's indexing decisions.
3. Verify the highest-impact claims against live HTTP responses and relevant repository code before proposing a fix. Check redirects (including www-to-apex and path preservation), robots.txt, sitemap URLs, canonical targets, noindex directives, and response codes when indexing is in question. Distinguish expected redirected/noncanonical URL exclusions from failures on the canonical URL.
4. Map actionable issues to their owner: `apps/website/` for Docusaurus pages, assets, metadata, and sitemap configuration; Cloudflare for edge redirects or security headers; third-party demo hosting for its asset/cache policy; Search Console for Google-specific indexing evidence. Never recommend changes to the wrong owner. Group repeated rule IDs by root cause, and mark heuristic, optional, or unverified findings as such. Do not add fake bylines, policies, structured data, or AI manifests merely to satisfy a score.
5. Return a concise prioritized plan, not a dump of every warning. For each action include: priority, exact issue ID(s) and affected URL(s), evidence and confidence, proposed change and owner, and how to verify it afterward. Put broken indexing/crawlability first, then confirmed content/accessibility/performance issues; keep security hardening separate from SEO ranking claims. Include expected/non-actionable findings and open verification questions. Do not promise indexing or a particular score increase.