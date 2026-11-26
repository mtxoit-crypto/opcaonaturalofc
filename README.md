# Welcome to your Lovable project

## Stripe Checkout

O catálogo pode ser publicado antes da ativação de pagamentos. Para habilitar o checkout de cartões em BRL:

1. No Supabase da loja, confira o histórico e aplique a função de pedidos de `supabase/migrations/20261116230000_stripe_checkout_orders.sql` e a migração `drizzle/migrations/0008_stripe_checkout_readiness.sql` que ainda estiverem pendentes. Use um banco separado para testes.
2. No Worker de produção, use secrets de servidor para `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` e `SUPABASE_SERVICE_ROLE_KEY`. A URL do Supabase deve apontar para o mesmo projeto do catálogo. Nunca use prefixo `VITE_` para secrets.
3. O destino de eventos da Stripe é `https://opcaonaturalofc.mtxoit.workers.dev/api/stripe/webhook`. Ele deve receber `checkout.session.completed` e `checkout.session.async_payment_succeeded`. Use o segredo de assinatura desse destino.
4. O endereço oficial do Worker já exige chave live. Para homologação, configure em ambiente separado `STRIPE_CHECKOUT_MODE=test`, `STRIPE_CHECKOUT_ORIGIN` com a origem da prévia, banco e credenciais de teste.
5. Confira `GET /api/stripe/checkout`. O campo `available` verifica a configuração local e a função do banco. Para validar a comunicação com a Stripe, conclua uma compra em homologação e reenvie o mesmo evento no painel. Deve existir um único pedido e uma única baixa de estoque. Uma entrega de evento com erro exige conciliação antes do envio da mercadoria, inclusive quando o preço ou o estoque mudarem entre a abertura do checkout e a confirmação.

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
