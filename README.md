# Welcome to your Lovable project

## Stripe Checkout

The website uses Stripe Checkout in test mode. Configure these server-only secrets in Cloudflare Workers before testing:

- `STRIPE_SECRET_KEY` (`sk_test_...`)
- `STRIPE_WEBHOOK_SECRET` (`whsec_...` for `/api/stripe/webhook`)
- `SUPABASE_SERVICE_ROLE_KEY` (server only; never expose it as a `VITE_` variable)

Apply the new Supabase migration in `supabase/migrations/` before enabling checkout. Product `stock_quantity` must contain the real available quantity; the site does not infer online availability from the legacy `in_stock` boolean.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Open your project in the [Lovable editor](https://lovable.dev) and keep building.

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: connect the project to GitHub and every change made in Lovable is committed straight to your repository.
- **Full ownership**: this code is yours. Push to your repository and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Built with

- TanStack Start
- TypeScript
- React
- Tailwind CSS
