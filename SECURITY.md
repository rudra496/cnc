# Security Policy

## Supported Versions

CNC Simulator Pro is a **100% client-side** web application — it runs entirely in your browser with no backend, database, or server. This dramatically reduces the attack surface.

| Version | Supported          |
| ------- | ------------------ |
| latest `main` | ✅ Yes |
| older releases | ❌ No — update to latest |

## Reporting a Vulnerability

We take security seriously, even for a client-side app. If you discover a security vulnerability, please report it responsibly:

1. **Do NOT open a public GitHub issue.**
2. Email or [open a private security advisory](https://github.com/rudra496/cnc/security/advisories/new) via GitHub's security tab.
3. Include a clear description of the issue, steps to reproduce, and potential impact.

You should receive a response within **72 hours**. Please allow time for investigation and a fix before any public disclosure.

## Scope

Given this is a static client-side simulator:

- ✅ **In scope:** XSS via user-provided G-code/program data, dependency vulnerabilities with real exploit paths, issues in the build/deploy pipeline.
- ❌ **Out of scope:** Self-XSS (running your own malicious code in your own browser), theoretical issues without a real attack vector, reports from automated scanners without verification.

## What's Not Collected

- No user accounts or authentication
- No server-side data storage — saved programs live in your browser's `localStorage`
- No analytics or tracking embedded in the app
- No cookies set by the application itself
