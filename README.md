# Hotel Booking System Service

Express 5 + TypeScript API for the hotel booking system.

## Requirements

- Node.js 22+
- npm 10+
- MongoDB 7, either installed locally or through Docker Compose

## Local Setup

```bash
npm ci
cp .env.example .env
docker compose up -d mongo
npm run seed
npm run dev
```

The API runs at `http://localhost:3333/api/v1` when using the default `.env.example` values.

## Environment

Required variables:

- `PORT`: API port. Use `3333` to match the Angular client defaults.
- `MONGODB_URI`: MongoDB connection string.
- `JWT_SECRET`: signing secret for authentication tokens. Replace the example before deploy.
- `PAYMENT_PROVIDER`: `mock` for local/test, `stripe` for Stripe integration.
- `STRIPE_SECRET_KEY`: required only when `PAYMENT_PROVIDER=stripe`.
- `PAYMENT_WEBHOOK_SECRET`: optional webhook signature secret.

## Quality Gates

```bash
npm run lint
npx tsc --noEmit
npm test -- --runInBand
```

For release validation, run the Angular client e2e suite after the service is running and seeded.

## Deploy Notes

- Use `npm ci` so the committed `package-lock.json` controls dependency versions.
- Provide a production `MONGODB_URI`; do not rely on the local Docker Compose database.
- Set a strong `JWT_SECRET`.
- Use `PAYMENT_PROVIDER=mock` only for demos or local validation.

## MongoDB Atlas Notes

For deploy, prefer a MongoDB Atlas connection string in `MONGODB_URI`.

Use a database name in the URI, for example:

```text
mongodb+srv://<user>:<password>@<cluster-host>/hotel-booking?retryWrites=true&w=majority
```

If local Node.js cannot resolve the Atlas `mongodb+srv` DNS record, use Atlas' non-SRV seedlist format locally. Keep both forms in secrets or `.env` files only; never commit real credentials.
