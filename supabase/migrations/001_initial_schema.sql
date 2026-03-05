-- =====================================================
-- MIGRATION: 001_initial_schema.sql
-- Banco de dados para MVP E-commerce Streetwear
-- Executar no Supabase SQL Editor
-- =====================================================

-- EXTENSÕES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ENUM TYPES
CREATE TYPE order_status AS ENUM (
  'pending', 'awaiting_payment', 'paid',
  'processing', 'shipped', 'delivered', 'cancelled', 'refunded'
);
CREATE TYPE payment_method_type AS ENUM ('pix', 'credit_card', 'boleto');
CREATE TYPE shipping_carrier    AS ENUM ('correios_pac', 'correios_sedex');

-- =====================================================
-- 1. PROFILES (espelha auth.users)
-- =====================================================
CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     TEXT,
  cpf           TEXT UNIQUE,
  phone         TEXT,
  is_admin      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger: cria profile automaticamente após signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- =====================================================
-- 2. ADDRESSES
-- =====================================================
CREATE TABLE addresses (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  label         TEXT,
  zip_code      TEXT NOT NULL,
  street        TEXT NOT NULL,
  number        TEXT NOT NULL,
  complement    TEXT,
  neighborhood  TEXT NOT NULL,
  city          TEXT NOT NULL,
  state         CHAR(2) NOT NULL,
  is_default    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 3. BRANDS
-- =====================================================
CREATE TABLE brands (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL UNIQUE,
  slug        TEXT NOT NULL UNIQUE,
  logo_url    TEXT,
  description TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 4. CATEGORIES (suporte a sub-categorias via parent_id)
-- =====================================================
CREATE TABLE categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  parent_id   UUID REFERENCES categories(id),
  image_url   TEXT,
  sort_order  INT NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 5. PRODUCTS
-- =====================================================
CREATE TABLE products (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id   UUID REFERENCES categories(id),
  brand_id      UUID REFERENCES brands(id),
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  description   TEXT,
  price         NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  compare_price NUMERIC(10,2),
  is_featured   BOOLEAN NOT NULL DEFAULT FALSE,
  collection    TEXT,     -- 'UKDRIP', 'Sportlife', etc.
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger: atualiza updated_at em products
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- =====================================================
-- 6. PRODUCT_VARIANTS (tamanho + cor)
-- =====================================================
CREATE TABLE product_variants (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku         TEXT NOT NULL UNIQUE,
  size        TEXT,
  color_name  TEXT,
  color_hex   TEXT,
  price_delta NUMERIC(10,2) NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE
);

-- =====================================================
-- 7. INVENTORY (estoque por variante)
-- =====================================================
CREATE TABLE inventory (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  variant_id         UUID NOT NULL UNIQUE REFERENCES product_variants(id),
  quantity           INT NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  low_stock_alert_at INT DEFAULT 5,
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger: cria inventory row ao criar variant
CREATE OR REPLACE FUNCTION create_inventory_for_variant()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO inventory (variant_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_variant_created
  AFTER INSERT ON product_variants
  FOR EACH ROW EXECUTE PROCEDURE create_inventory_for_variant();

-- =====================================================
-- 8. PRODUCT_IMAGES
-- =====================================================
CREATE TABLE product_images (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id  UUID REFERENCES product_variants(id),
  url         TEXT NOT NULL,
  alt_text    TEXT,
  sort_order  INT NOT NULL DEFAULT 0,
  is_primary  BOOLEAN NOT NULL DEFAULT FALSE
);

-- =====================================================
-- 9. ORDERS
-- =====================================================
CREATE TABLE orders (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id          UUID REFERENCES profiles(id),
  shipping_address_id UUID REFERENCES addresses(id),
  status              order_status NOT NULL DEFAULT 'pending',
  subtotal            NUMERIC(10,2) NOT NULL,
  shipping_cost       NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount            NUMERIC(10,2) NOT NULL DEFAULT 0,
  total               NUMERIC(10,2) NOT NULL,
  notes               TEXT,
  mp_preference_id    TEXT,
  mp_payment_id       TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- =====================================================
-- 10. ORDER_ITEMS
-- =====================================================
CREATE TABLE order_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id    UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  variant_id  UUID NOT NULL REFERENCES product_variants(id),
  quantity    INT NOT NULL CHECK (quantity > 0),
  unit_price  NUMERIC(10,2) NOT NULL,
  total_price NUMERIC(10,2) NOT NULL
);

-- =====================================================
-- 11. SHIPMENTS
-- =====================================================
CREATE TABLE shipments (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id       UUID NOT NULL REFERENCES orders(id),
  carrier        shipping_carrier NOT NULL,
  tracking_code  TEXT,
  shipped_at     TIMESTAMPTZ,
  estimated_days INT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 12. PAYMENT_TRANSACTIONS (log de eventos do Mercado Pago)
-- =====================================================
CREATE TABLE payment_transactions (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id       UUID NOT NULL REFERENCES orders(id),
  mp_payment_id  TEXT,
  amount         NUMERIC(10,2),
  method         payment_method_type,
  status         TEXT,
  raw_payload    JSONB,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES
-- =====================================================
CREATE INDEX idx_products_category    ON products(category_id);
CREATE INDEX idx_products_brand       ON products(brand_id);
CREATE INDEX idx_products_slug        ON products(slug);
CREATE INDEX idx_products_featured    ON products(is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_products_collection  ON products(collection);
CREATE INDEX idx_variants_product     ON product_variants(product_id);
CREATE INDEX idx_orders_profile       ON orders(profile_id);
CREATE INDEX idx_orders_status        ON orders(status);
CREATE INDEX idx_order_items_order    ON order_items(order_id);
CREATE INDEX idx_payment_tx_order     ON payment_transactions(order_id);
CREATE INDEX idx_payment_tx_mp_id     ON payment_transactions(mp_payment_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses           ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders              ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items         ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- Produtos, categorias e marcas são públicos (leitura)
ALTER TABLE products       ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images  ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands          ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories      ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory       ENABLE ROW LEVEL SECURITY;

-- Policies: leitura pública para catálogo
CREATE POLICY "public_read_products"    ON products    FOR SELECT USING (is_active = TRUE);
CREATE POLICY "public_read_variants"    ON product_variants FOR SELECT USING (is_active = TRUE);
CREATE POLICY "public_read_images"      ON product_images   FOR SELECT USING (TRUE);
CREATE POLICY "public_read_brands"      ON brands      FOR SELECT USING (is_active = TRUE);
CREATE POLICY "public_read_categories"  ON categories  FOR SELECT USING (is_active = TRUE);
CREATE POLICY "public_read_inventory"   ON inventory   FOR SELECT USING (TRUE);

-- Policies: clientes acessam apenas seus próprios dados
CREATE POLICY "profiles_own"   ON profiles   FOR ALL  USING (auth.uid() = id);
CREATE POLICY "addresses_own"  ON addresses  FOR ALL  USING (auth.uid() = profile_id);
CREATE POLICY "orders_own"     ON orders     FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "order_items_own" ON order_items FOR SELECT
  USING (order_id IN (SELECT id FROM orders WHERE profile_id = auth.uid()));

-- =====================================================
-- SEED: Categorias e Brands iniciais
-- =====================================================
INSERT INTO categories (name, slug, sort_order) VALUES
  ('Roupas',      'roupas',      1),
  ('Sneakers',    'sneakers',    2),
  ('Acessórios',  'acessorios',  3),
  ('Marcas',      'marcas',      4);

INSERT INTO brands (name, slug) VALUES
  ('Syna World',  'syna-world'),
  ('Trapstar',    'trapstar'),
  ('Nike',        'nike'),
  ('Adidas',      'adidas'),
  ('New Balance', 'new-balance'),
  ('Stone Island','stone-island');
