# Africa MLS Lite

The public-facing property listings platform powered by Manop AI.

Displays structured African property data from Supabase.
Agents submit listings via WhatsApp — Manop parses and structures the data.

## Stack

- Next.js 14 (App Router)
- TypeScript
- Supabase (data layer)
- Vercel (deployment)

## Structure

```
manop_apps/africa_mls/
  app/
    components/
      PropertyCard.tsx   — listing card component
    lib/
      supabase.ts        — Supabase client + query functions
    listing/[id]/
      page.tsx           — property detail page
    listings/
      page.tsx           — listings browser with city filter
    layout.tsx           — root layout (nav + footer)
    page.tsx             — homepage (hero + stats + live feed)
  styles/
    globals.css          — global styles
  .env.local.example     — environment variables template
  package.json
  next.config.js
  tsconfig.json
```

## Setup

```bash
cd manop_apps/africa_mls
npm install
cp .env.local.example .env.local
# Fill in your Supabase keys
npm run dev
```

Open http://localhost:3000

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

Get these from: Supabase Dashboard → Settings → API

## Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from africa_mls folder
cd manop_apps/africa_mls
vercel

# Add environment variables in Vercel dashboard
# Settings → Environment Variables
```

Or connect GitHub repo to Vercel and it deploys automatically on every push.

## Data Flow

```
Agent sends WhatsApp message
        ↓
Manop parses via WhatsApp Parser (Python)
        ↓
Structured record saved to Supabase properties table
        ↓
This app reads from Supabase and displays it
        ↓
Diaspora investors browse listings
```

This app handles DISPLAY only.
All data ingestion happens via Manop's Python backend.

## Pages

- `/`           — Homepage: hero, stats, latest 9 listings, WA CTA
- `/listings`   — All listings with city filter
- `/listing/[id]` — Property detail with AI insights

## Notes

- Listings auto-refresh every 60 seconds (ISR)
- WhatsApp CTA pre-fills message template for agents
- AI insights show real data when computed by Manop, mock data otherwise
- Mobile-first design — most African agents use phones
