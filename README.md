# Legacy Order Management API

An internal REST API for managing users, products, and orders. It backs the
order management workflows used by the operations team.

## What it does

- Create and look up users
- Create and look up products
- Create orders and add products to them
- Retrieve an order and list orders for a user
- Update order status and cancel orders
- Export orders to S3 and publish order events to SNS

## Architecture

The service is a Node.js / Express application backed by PostgreSQL.

```
src/
  routes/        express routers
  controllers/   request handlers
  services/      data access / business logic
  db/            database pool, schema and migration script
  middleware/    auth and error handling
  utils/         config, helpers and AWS integration
  app.js         express app wiring
  server.js      entrypoint
```

Requests come in through the routers, which delegate to controllers. Some
controllers use the service layer for database access and others query the
database pool directly. Order exports and notifications are handled through the
AWS SDK (S3 and SNS).

## Requirements

- Node.js 22
- PostgreSQL 12+
- Docker / Docker Compose (optional, for local runs)

## Running locally with Docker Compose

```bash
docker-compose up --build
```

This starts PostgreSQL, runs the migrations, and starts the API on port 3000.

## Running locally without Docker

1. Install dependencies:

   ```bash
   npm install
   ```

2. Make sure PostgreSQL is running and a database exists that matches your
   environment variables (see below).

3. Run the migrations (this also seeds a few sample products):

   ```bash
   npm run migrate
   ```

4. Start the server:

   ```bash
   npm start
   ```

The API will be available at `http://localhost:3000`.

## Environment variables

| Variable        | Description                        | Default                  |
|-----------------|------------------------------------|--------------------------|
| `PORT`          | HTTP port                          | `3000`                   |
| `DB_HOST`       | PostgreSQL host                    | `localhost`              |
| `DB_PORT`       | PostgreSQL port                    | `5432`                   |
| `DB_USER`       | PostgreSQL user                    | `postgres`               |
| `DB_PASSWORD`   | PostgreSQL password                | `postgres`               |
| `DB_NAME`       | PostgreSQL database                | `orders`                 |
| `JWT_SECRET`    | Secret used to sign JWTs           | `secret`                 |
| `AWS_REGION`    | AWS region                         | `us-east-1`              |
| `EXPORT_BUCKET` | S3 bucket for order exports        | `legacy-orders-exports`  |
| `SNS_TOPIC_ARN` | SNS topic ARN for order events     | (empty)                  |

Copy `.env.example` to `.env` to get started.

## Database setup

The schema lives in `src/db/schema.sql` and is applied by the migration script:

```bash
npm run migrate
```

Tables: `users`, `products`, `orders`, `order_items`.

## API

| Method | Path                     | Description                     |
|--------|--------------------------|---------------------------------|
| GET    | `/health`                | Health check                    |
| POST   | `/users`                 | Create a user                   |
| POST   | `/users/login`           | Log in, returns a JWT           |
| GET    | `/users`                 | List users                      |
| GET    | `/users/:id`             | Get a user                      |
| POST   | `/products`              | Create a product                |
| GET    | `/products`              | List products (`?search=`)      |
| GET    | `/products/:id`          | Get a product                   |
| POST   | `/orders`                | Create an order                 |
| GET    | `/orders/:id`            | Get an order                    |
| POST   | `/orders/:id/items`      | Add a product to an order       |
| PUT    | `/orders/:id/status`     | Update order status (auth)      |
| POST   | `/orders/:id/cancel`     | Cancel an order                 |
| POST   | `/orders/:id/export`     | Export an order to S3 (auth)    |
| GET    | `/orders/user/:userId`   | List orders for a user          |

## Tests

```bash
npm test
```

Tests are written with Jest and supertest.

## Infrastructure

Terraform for a basic AWS deployment (EC2, RDS PostgreSQL, S3, SNS, security
groups and an IAM role) lives in `terraform/`.

```bash
cd terraform
terraform init
terraform plan
```
