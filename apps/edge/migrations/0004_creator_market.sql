-- Rich creator media metadata. The actual bytes can live in an object store or
-- an approved CDN; D1 keeps the typed references and moderation state.
ALTER TABLE posts ADD COLUMN format TEXT NOT NULL DEFAULT 'text';
ALTER TABLE posts ADD COLUMN media_json TEXT;
ALTER TABLE posts ADD COLUMN live_url TEXT;
ALTER TABLE posts ADD COLUMN live_starts_at TEXT;

ALTER TABLE post_comments ADD COLUMN kind TEXT NOT NULL DEFAULT 'text';
ALTER TABLE post_comments ADD COLUMN attachment_url TEXT;

CREATE TABLE IF NOT EXISTS marketplace_products (
  id TEXT PRIMARY KEY,
  seller_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'CNY',
  image_url TEXT,
  destination_id TEXT,
  stock INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'sold', 'removed')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS marketplace_products_feed ON marketplace_products(status, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS marketplace_products_seller ON marketplace_products(seller_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS marketplace_orders (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES marketplace_products(id) ON DELETE CASCADE,
  buyer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'cancelled')),
  created_at TEXT NOT NULL,
  UNIQUE (product_id, buyer_id, status)
);
CREATE INDEX IF NOT EXISTS marketplace_orders_buyer ON marketplace_orders(buyer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS marketplace_orders_product ON marketplace_orders(product_id, created_at DESC);
