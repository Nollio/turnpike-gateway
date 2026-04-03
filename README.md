# Turnpike Gateway

AI API Gateway & Cost Intelligence Platform — route, monitor, and control AI API spend.

## Features

- **AI Proxy**: OpenAI and Anthropic-compatible endpoints with streaming support
- **Usage Tracking**: Token counting, cost calculation, per-model and per-key analytics
- **Dashboard**: Spend visualization by model, API key, and time period
- **Stripe Billing**: Starter ($99/mo) and Pro ($299/mo) subscription tiers
- **API Key Management**: SHA-256 hashed keys with per-provider upstream routing

## Tech Stack

- **Framework**: Next.js 16 (App Router, Edge Functions)
- **Database**: Neon Postgres (serverless)
- **Cache**: Upstash Redis
- **Payments**: Stripe
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 20+
- Neon Postgres database
- Upstash Redis instance
- Stripe account (test mode)

### Setup

1. Clone and install:
   ```bash
   git clone https://github.com/Nollio/turnpike-gateway.git
   cd turnpike-gateway
   npm install
   ```

2. Copy environment variables:
   ```bash
   cp .env.example .env.local
   ```

3. Fill in your credentials in `.env.local`

4. Run the database schema:
   ```bash
   psql $DATABASE_URL -f schema.sql
   ```

5. Start the dev server:
   ```bash
   npm run dev
   ```

## API Endpoints

### Proxy
- `POST /api/v1/chat/completions` — OpenAI-compatible proxy
- `POST /api/v1/messages` — Anthropic-compatible proxy

### Management
- `GET/POST /api/keys` — API key management
- `GET /api/usage` — Usage analytics
- `POST /api/billing/checkout` — Stripe checkout
- `POST /api/webhooks/stripe` — Stripe webhook handler

## License

Proprietary — Turnpike / Nollio Labs
