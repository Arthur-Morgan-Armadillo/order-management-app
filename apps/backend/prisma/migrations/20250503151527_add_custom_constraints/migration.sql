-- AlterTable
ALTER TABLE "users" ADD COLUMN     "temp" TEXT;

-- User Constraints
ALTER TABLE "users"
ADD CONSTRAINT "users_balance_non_negative" CHECK (balance >= 0);

ALTER TABLE "users"
ADD CONSTRAINT "users_name_non_empty" CHECK (name <> '');

-- Product Constraints
ALTER TABLE "products"
ADD CONSTRAINT "products_price_non_negative" CHECK (price >= 0);

ALTER TABLE "products"
ADD CONSTRAINT "products_stock_non_negative" CHECK (stock >= 0);

ALTER TABLE "products"
ADD CONSTRAINT "products_name_non_empty" CHECK (name <> '');

-- Order Constraints
ALTER TABLE "orders"
ADD CONSTRAINT "orders_quantity_positive" CHECK (quantity > 0);

ALTER TABLE "orders"
ADD CONSTRAINT "orders_total_price_non_negative" CHECK (total_price >= 0);
