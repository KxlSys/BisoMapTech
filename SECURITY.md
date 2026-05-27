# Security Policy

## Supported Versions

BisoMapTech is currently under active development.

Security fixes are applied to the latest version available on the `main` branch.

---

## Reporting a Vulnerability

If you discover a security vulnerability, please DO NOT open a public GitHub issue.

Instead:
- Contact the maintainers privately
- Or open a confidential security advisory if available

Please include:
- vulnerability description
- reproduction steps
- potential impact
- screenshots/logs if relevant

---

## Security Practices

This project implements several security mechanisms:

- Supabase Row Level Security (RLS)
- End-to-End Encryption (E2EE)
- Protected GitHub branches
- Mandatory Pull Requests
- CI/CD verification
- Dependabot dependency monitoring
- Sentry error monitoring
- CodeQL static analysis

---

## Sensitive Data

Never expose:
- API keys
- Supabase service role keys
- personal addresses
- private encryption keys

All secrets must remain server-side or inside secure environment variables.

---

## Frontend Security

Avoid:
- unsafe HTML rendering
- unsanitized user input
- insecure local storage usage
- bypassing auth logic

---

## Authentication

Authentication is managed through Supabase Auth.

Never trust frontend role checks alone.
Always validate permissions server-side using RLS.

---

## Responsible Disclosure

We appreciate responsible disclosure practices and will investigate all legitimate reports as quickly as possible.