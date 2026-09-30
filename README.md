# TanAir Cloud

Multi-tenant AI SaaS platform. Built with Next.js 14, Supabase, and Hermes Agent.

## Architecture

- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend:** Supabase (Auth, Database, Storage)
- **AI Engine:** Hermes Agent integration via adapter layer
- **Deployment:** Vercel

## Getting Started

```bash
npm install
npm run dev
```

## Project Structure

- `app/` — Next.js App Router pages & API routes
- `components/` — Reusable UI components
- `lib/` — Utilities, adapters, security
- `docs/` — Architecture decisions & project documentation
- `tests/` — Unit & integration tests

## License

MIT
