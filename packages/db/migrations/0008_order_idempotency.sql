-- Order idempotency: prevents duplicate orders from double-clicks/retries (TTL 5 min in app logic)
CREATE TABLE IF NOT EXISTS "order_idempotency" (
  "idempotency_key" varchar(64) PRIMARY KEY NOT NULL,
  "order_id" uuid NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "order_idempotency_created_at_idx" ON "order_idempotency" ("created_at");
