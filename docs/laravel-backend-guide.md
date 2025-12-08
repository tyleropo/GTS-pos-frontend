# Laravel Backend Guide for `nextjs-pos`

This document captures a pragmatic checklist for spinning up the Laravel API that the Next.js POS frontend already expects. Follow the steps in order: database migrations → models/relationships → controllers + routes → authentication. Each section includes the concrete field names, endpoints, and JSON shapes the UI currently consumes.

> **Versions tested**  
> Laravel 11, PHP 8.2, MySQL 8.0, Composer 2.x. Adjust commands as needed for your environment.

---

## 1. Project Setup

```bash
laravel new pos-api
cd pos-api
cp .env.example .env
php artisan key:generate
```

Update `.env` with your database credentials and set the frontend URL for Sanctum:

```dotenv
APP_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000
SANCTUM_STATEFUL_DOMAINS=localhost:3000
```

Install Sanctum (for SPA token auth) and Breeze (for scaffolding routes/migrations quickly):

```bash
composer require laravel/sanctum laravel/breeze --dev
php artisan breeze:install api
php artisan migrate
```

The Breeze API stack gives you `/login`, `/register`, `/user`, `/logout`, and refresh-token endpoints that align with the frontend’s `auth.ts`.

---

## 2. Core Migrations

Create the tables required by the POS, inventory, and dashboard pages. At minimum you need `categories`, `suppliers`, `products`, `repairs`, `customers`, `transactions`, and `purchase_orders`. The fields below match the types used in `productSchema`, etc.

```bash
php artisan make:migration create_categories_table
php artisan make:migration create_suppliers_table
php artisan make:migration create_products_table
php artisan make:migration create_repairs_table
php artisan make:migration create_customers_table
php artisan make:migration create_transactions_table
php artisan make:migration create_purchase_orders_table
```

Example `products` migration (trim for brevity):

```php
Schema::create('products', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->string('sku')->unique();
    $table->string('barcode')->nullable()->unique();
    $table->string('name');
    $table->text('description')->nullable();
    $table->foreignUuid('category_id')->nullable()->constrained()->nullOnDelete();
    $table->foreignUuid('supplier_id')->nullable()->constrained()->nullOnDelete();
    $table->string('brand')->nullable();
    $table->string('model')->nullable();
    $table->decimal('cost_price', 12, 2)->default(0);
    $table->decimal('selling_price', 12, 2)->default(0);
    $table->decimal('markup_percentage', 5, 2)->nullable();
    $table->decimal('tax_rate', 5, 2)->nullable();
    $table->integer('stock_quantity')->default(0);
    $table->integer('reorder_level')->default(0);
    $table->integer('max_stock_level')->nullable();
    $table->string('unit_of_measure')->nullable();
    $table->decimal('weight', 8, 2)->nullable();
    $table->string('dimensions')->nullable();
    $table->string('image_url')->nullable();
    $table->boolean('is_active')->default(true);
    $table->boolean('is_serialized')->default(false);
    $table->integer('warranty_period')->nullable();
    $table->timestamps();
});
```

Repeat similar structures for:

- `categories`: `id`, `name`, `description`, `parent_id`.
- `suppliers`: `supplier_code`, `company_name`, `contact_person`, etc.
- `repairs`: `ticket_number`, `customer_id`, `status`, `device`, `issue`, `promised_at`.
- `customers`: `name`, `email`, `phone`, `address`.
- `transactions`: `invoice_number`, `customer_id`, `total`, `payment_method`, `metadata`.
- `purchase_orders`: `po_number`, `supplier_id`, `status`, `expected_at`.

Run all migrations:

```bash
php artisan migrate
```

### Full Migration Examples

Below are opinionated stubs for every table the frontend consumes. Adjust as needed (indexes, constraints, soft deletes, multi-tenant support, etc.).

#### `create_categories_table.php`

```php
Schema::create('categories', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->string('name')->unique();
    $table->text('description')->nullable();
    $table->foreignUuid('parent_id')->nullable()->constrained('categories')->nullOnDelete();
    $table->timestamps();
});
```

#### `create_suppliers_table.php`

```php
Schema::create('suppliers', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->string('supplier_code')->nullable()->unique();
    $table->string('company_name');
    $table->string('contact_person')->nullable();
    $table->string('email')->nullable();
    $table->string('phone')->nullable();
    $table->text('address')->nullable();
    $table->timestamps();
});
```

#### `create_products_table.php`

```php
Schema::create('products', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->string('sku')->unique();
    $table->string('barcode')->nullable()->unique();
    $table->string('name');
    $table->text('description')->nullable();
    $table->foreignUuid('category_id')->nullable()->constrained()->nullOnDelete();
    $table->foreignUuid('supplier_id')->nullable()->constrained()->nullOnDelete();
    $table->string('brand')->nullable();
    $table->string('model')->nullable();
    $table->decimal('cost_price', 12, 2)->default(0);
    $table->decimal('selling_price', 12, 2)->default(0);
    $table->decimal('markup_percentage', 6, 2)->nullable();
    $table->decimal('tax_rate', 5, 2)->nullable();
    $table->integer('stock_quantity')->default(0);
    $table->integer('reorder_level')->default(0);
    $table->integer('max_stock_level')->nullable();
    $table->string('unit_of_measure')->nullable();
    $table->decimal('weight', 8, 2)->nullable();
    $table->string('dimensions')->nullable();
    $table->string('image_url')->nullable();
    $table->boolean('is_active')->default(true);
    $table->boolean('is_serialized')->default(false);
    $table->integer('warranty_period')->nullable();
    $table->timestamps();
});
```

#### `create_customers_table.php`

```php
Schema::create('customers', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->string('name');
    $table->string('email')->nullable()->unique();
    $table->string('phone')->nullable();
    $table->text('address')->nullable();
    $table->string('company')->nullable();
    $table->timestamps();
});
```

#### `create_repairs_table.php`

```php
Schema::create('repairs', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->string('ticket_number')->unique();
    $table->foreignUuid('customer_id')->nullable()->constrained()->nullOnDelete();
    $table->string('device')->nullable();
    $table->string('serial_number')->nullable();
    $table->enum('status', ['pending', 'in_progress', 'completed', 'cancelled'])->default('pending');
    $table->text('issue_description')->nullable();
    $table->text('resolution')->nullable();
    $table->timestamp('promised_at')->nullable();
    $table->timestamps();
});
```

#### `create_transactions_table.php`

```php
Schema::create('transactions', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->string('invoice_number')->unique();
    $table->foreignUuid('customer_id')->nullable()->constrained()->nullOnDelete();
    $table->decimal('subtotal', 12, 2)->default(0);
    $table->decimal('tax', 12, 2)->default(0);
    $table->decimal('total', 12, 2)->default(0);
    $table->enum('payment_method', ['cash', 'card', 'gcash'])->default('cash');
    $table->json('items')->nullable(); // line items snapshot
    $table->json('meta')->nullable();  // any additional data
    $table->timestamps();
});
```

#### `create_purchase_orders_table.php`

```php
Schema::create('purchase_orders', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->string('po_number')->unique();
    $table->foreignUuid('supplier_id')->nullable()->constrained()->nullOnDelete();
    $table->enum('status', ['draft', 'submitted', 'received', 'cancelled'])->default('draft');
    $table->date('expected_at')->nullable();
    $table->decimal('subtotal', 12, 2)->default(0);
    $table->decimal('tax', 12, 2)->default(0);
    $table->decimal('total', 12, 2)->default(0);
    $table->json('items')->nullable();
    $table->json('meta')->nullable();
    $table->timestamps();
});
```

#### Pivot / Supporting Tables

If you need many-to-many relationships (e.g., transactions ↔ products, purchase orders ↔ products), create pivot tables with quantities and pricing:

```php
Schema::create('product_transaction', function (Blueprint $table) {
    $table->id();
    $table->foreignUuid('transaction_id')->constrained()->cascadeOnDelete();
    $table->foreignUuid('product_id')->constrained()->cascadeOnDelete();
    $table->integer('quantity')->default(1);
    $table->decimal('unit_price', 12, 2);
    $table->decimal('line_total', 12, 2);
});
```

Repeat for `product_purchase_order`.

Seeders can mirror the mock data used in the frontend (top-selling, low stock, etc.) for development.

---

## 3. Eloquent Models & Relationships

Create the models and wire up their relationships:

```bash
php artisan make:model Category -m
php artisan make:model Supplier -m
php artisan make:model Product -m
php artisan make:model Repair -m
php artisan make:model Customer -m
php artisan make:model Transaction -m
php artisan make:model PurchaseOrder -m
```

Example `Product` model (`app/Models/Product.php`):

```php
class Product extends Model
{
    use HasFactory, Uuids;

    protected $guarded = [];

    protected $casts = [
        'cost_price' => 'float',
        'selling_price' => 'float',
        'markup_percentage' => 'float',
        'tax_rate' => 'float',
        'stock_quantity' => 'integer',
        'reorder_level' => 'integer',
        'is_active' => 'boolean',
        'is_serialized' => 'boolean',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }
}
```

Repeat for other models (`hasMany` relationships for products on categories/suppliers, `hasMany` repairs per customer, etc.).

---

## 4. Controllers & Routes

### 4.1 Products API

Create a dedicated controller:

```bash
php artisan make:controller Api/ProductController --resource --model=Product
```

Recommended endpoints (the frontend calls these exact routes):

| HTTP | Route | Notes |
| ---- | ----- | ----- |
| `GET /api/products` | Accepts `search`, `category_id`, `page`, `per_page`, `low_stock`. Return paginated JSON shaped like `productSchema`. |
| `GET /api/products/low-stock` | Top 10 low-stock items. |
| `GET /api/products/categories` | Category list. |
| `GET /api/products/barcode/{code}` | Lookup by barcode/SKU. |
| `POST /api/products` | Create product from payload used in `AddProductModal`. |
| `PUT /api/products/{id}` | Update product for inventory adjustments. |

Pagination helper:

```php
public function index(Request $request)
{
    $query = Product::with(['category', 'supplier'])
        ->when($request->search, function ($q, $term) {
            $q->where(fn ($inner) => $inner
                ->where('name', 'like', "%{$term}%")
                ->orWhere('sku', 'like', "%{$term}%")
                ->orWhere('barcode', 'like', "%{$term}%"));
        })
        ->when($request->category_id, fn ($q, $categoryId) => $q->where('category_id', $categoryId))
        ->when($request->boolean('low_stock'), fn ($q) => $q->whereColumn('stock_quantity', '<=', 'reorder_level'));

    return ProductResource::collection(
        $query->paginate($request->integer('per_page', 24))
    );
}
```

Return resources that match the Zod schemas (e.g., `ProductResource` casts numeric strings to floats).

### 4.2 Dashboard API

The dashboard page calls:

- `GET /api/dashboard/metrics`
- `GET /api/dashboard/recent-activity`
- `GET /api/dashboard/low-stock`
- `GET /api/dashboard/top-selling`
- `GET /api/dashboard/pending-repairs`

Create a `DashboardController` with lightweight queries/aggregations:

```php
Route::prefix('dashboard')->middleware('auth:sanctum')->group(function () {
    Route::get('metrics', [DashboardController::class, 'metrics']);
    Route::get('recent-activity', [DashboardController::class, 'recentActivity']);
    Route::get('low-stock', [DashboardController::class, 'lowStock']);
    Route::get('top-selling', [DashboardController::class, 'topSelling']);
    Route::get('pending-repairs', [DashboardController::class, 'pendingRepairs']);
});
```

Each method should return arrays shaped like the frontend Zod schemas (`metricSchema`, `activityItemSchema`, `repairsSchema`). Use caching (e.g., `Cache::remember`) if queries are expensive.

### 4.3 Repairs, Customers, Transactions, Purchase Orders

Create resource controllers for each domain:

```bash
php artisan make:controller Api/RepairController --api --model=Repair
php artisan make:controller Api/CustomerController --api --model=Customer
php artisan make:controller Api/TransactionController --api --model=Transaction
php artisan make:controller Api/PurchaseOrderController --api --model=PurchaseOrder
```

Routes (sample):

```php
Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('repairs', RepairController::class);
    Route::apiResource('customers', CustomerController::class);
    Route::apiResource('transactions', TransactionController::class);
    Route::apiResource('purchase-orders', PurchaseOrderController::class);
});
```

These endpoints power the mock tables currently displayed on `/repairs`, `/customers`, `/transactions`, and `/purchase-orders`. When you swap out the mock data, fetch from these APIs on the frontend.

---

## 5. Authentication

The frontend expects token-based auth with refresh support:

1. **User Registration / Login** – Provided by Breeze API stack (POST `/register`, POST `/login`).
2. **Token Storage** – The frontend stores `access_token` and `refresh_token` from `/login` and `/auth/refresh`. Implement refresh tokens by extending Sanctum or using Laravel Passport:

   - Create a `RefreshToken` model/table with `token`, `user_id`, `expires_at`.
   - Issue both access + refresh tokens on login.
   - `/auth/refresh` validates the refresh token, issues a new Sanctum token, and returns `{ access_token, refresh_token }`.
   - `/logout` revokes both.

3. **Middleware** – Protect all `/api/*` business routes with `auth:sanctum`.
4. **CORS/Same-Site** – Ensure `config/cors.php` allows `localhost:3000` with `supports_credentials => true`. Sanctum will handle SPA cookies.

Frontend references:

- `src/lib/api-client.ts` attaches the bearer token to each request.
- `src/lib/auth/token-storage.ts` (not shown above) stores access/refresh tokens.
- Error handling in `apiClient` refreshes tokens on `401` responses.

---

## 6. Testing & Tooling

- Run `php artisan test` (feature tests around product CRUD and dashboard endpoints).
- Use Laravel Pint or PHP-CS-Fixer for formatting.
- Enable API resource caching (`php artisan optimize`) for dashboard endpoints if traffic is high.

---

## 7. Deploy & Integrate

1. Deploy Laravel API (Forge, Vapor, Docker, etc.).
2. Update `.env` in Next.js with `NEXT_PUBLIC_API_URL=https://api.example.com/api`.
3. Rebuild the frontend (`npm run build && npm run start`).
4. Smoke-test POS (barcode search, camera scanning, cart operations) and Inventory (filters, create product) against the live API.

This guide gives you the baseline data model, routes, and auth flow to keep the Next.js POS frontend functional. Extend the schema/controllers as your business logic grows (e.g., loyalty programs, multi-store support, audit logs).
