# @menumate/db

Database package for MenuMate using Drizzle ORM with PostgreSQL.

## Setup

1. Ensure PostgreSQL is running (via Docker Compose):
```bash
docker-compose up -d
```

2. Set the `DATABASE_URL` environment variable in your `.env` file:
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/menumate?schema=public"
```

## Migrations

### Generate Migration
```bash
npm run generate
```

This will create migration files in the `drizzle/` directory based on schema changes.

### Run Migrations
```bash
npm run migrate
```

This will apply all pending migrations to the database.

### Drizzle Studio
To view and edit data in the database:
```bash
npm run studio
```

## Schema

The schema includes:
- `users` - User accounts with roles and status
- `restaurants` - Restaurant organizations
- `categories` - Menu categories
- `menu_items` - Menu items/products
- `orders` - Order transactions

See `src/schema.ts` for full schema definition.

