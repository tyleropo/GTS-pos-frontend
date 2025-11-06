# Comprehensive POS System Technical Roadmap
## Laravel Backend + Next.js Frontend + MySQL Database

## Executive Summary

This document outlines a comprehensive technical roadmap for transforming the existing Next.js POS system mockup into a production-ready, scalable point-of-sale solution using **Laravel as the backend API**, **MySQL as the database**, and **Next.js as the frontend**. The roadmap addresses database design, authentication, state management, API architecture, UI/UX improvements, security, performance, and scalability considerations.

## Current Architecture Analysis

### Existing Implementation
- **Frontend**: Next.js 15 with App Router and TypeScript
- **UI Library**: shadcn/ui components with TailwindCSS
- **Backend**: To be built with Laravel 11
- **Database**: MySQL 8.0+
- **Current State**: Frontend mockup with static data, basic routing, and component structure
- **Modules**: Dashboard, POS, Inventory, Transactions, Customers, Purchase Orders, Repairs

### Technology Stack
```
Frontend: Next.js 15 + TypeScript + TailwindCSS + shadcn/ui
Backend: Laravel 11 + PHP 8.2+
Database: MySQL 8.0+
Cache: Redis
Queue: Laravel Queue (Redis driver)
Storage: AWS S3 / Local Storage
Real-time: Laravel WebSockets / Pusher
```

### Critical Gaps
1. No Laravel backend API implementation
2. No MySQL database schema or migrations
3. Missing centralized state management in frontend
4. No API integration between Next.js and Laravel
5. Basic authentication without Laravel Sanctum/Passport
6. No real-time updates or WebSocket implementation
7. Lack of comprehensive testing infrastructure
8. Limited mobile responsiveness and accessibility
9. No performance optimization strategies
10. Missing security best practices for Laravel

---

## 1. MySQL Database Schema Design & Entity Relationships

### Laravel Migration Files

```php
<?php
// database/migrations/2024_01_01_000001_create_users_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('users', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->string('first_name');
            $table->string('last_name');
            $table->enum('role', ['admin', 'manager', 'cashier', 'technician'])->default('cashier');
            $table->boolean('is_active')->default(true);
            $table->timestamp('last_login_at')->nullable();
            $table->rememberToken();
            $table->timestamps();
            
            $table->index(['email', 'is_active']);
            $table->index('role');
        });
    }

    public function down()
    {
        Schema::dropIfExists('users');
    }
};

// database/migrations/2024_01_01_000002_create_customers_table.php
return new class extends Migration
{
    public function up()
    {
        Schema::create('customers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('customer_code', 50)->unique();
            $table->string('first_name', 100);
            $table->string('last_name', 100);
            $table->string('email')->nullable();
            $table->string('phone', 20)->nullable();
            $table->text('address')->nullable();
            $table->string('city', 100)->nullable();
            $table->string('state', 100)->nullable();
            $table->string('postal_code', 20)->nullable();
            $table->string('country', 100)->default('Philippines');
            $table->enum('customer_type', ['regular', 'vip', 'wholesale'])->default('regular');
            $table->integer('loyalty_points')->default(0);
            $table->decimal('total_spent', 12, 2)->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            $table->index(['customer_code', 'is_active']);
            $table->index('customer_type');
            $table->index('email');
        });
    }
};

// database/migrations/2024_01_01_000003_create_suppliers_table.php
return new class extends Migration
{
    public function up()
    {
        Schema::create('suppliers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('supplier_code', 50)->unique();
            $table->string('company_name');
            $table->string('contact_person')->nullable();
            $table->string('email')->nullable();
            $table->string('phone', 20)->nullable();
            $table->text('address')->nullable();
            $table->string('city', 100)->nullable();
            $table->string('state', 100)->nullable();
            $table->string('postal_code', 20)->nullable();
            $table->string('country', 100)->nullable();
            $table->string('payment_terms', 100)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            $table->index(['supplier_code', 'is_active']);
        });
    }
};

// database/migrations/2024_01_01_000004_create_categories_table.php
return new class extends Migration
{
    public function up()
    {
        Schema::create('categories', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->text('description')->nullable();
            $table->uuid('parent_id')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            $table->foreign('parent_id')->references('id')->on('categories')->onDelete('set null');
            $table->index(['name', 'is_active']);
        });
    }
};

// database/migrations/2024_01_01_000005_create_products_table.php
return new class extends Migration
{
    public function up()
    {
        Schema::create('products', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('sku', 100)->unique();
            $table->string('barcode', 100)->unique()->nullable();
            $table->string('name');
            $table->text('description')->nullable();
            $table->uuid('category_id')->nullable();
            $table->uuid('supplier_id')->nullable();
            $table->string('brand')->nullable();
            $table->string('model')->nullable();
            $table->decimal('cost_price', 10, 2);
            $table->decimal('selling_price', 10, 2);
            $table->decimal('markup_percentage', 5, 2)->nullable();
            $table->decimal('tax_rate', 5, 2)->default(0.12);
            $table->integer('stock_quantity')->default(0);
            $table->integer('reorder_level')->default(0);
            $table->integer('max_stock_level')->nullable();
            $table->string('unit_of_measure', 50)->default('piece');
            $table->decimal('weight', 8, 2)->nullable();
            $table->string('dimensions', 100)->nullable();
            $table->string('image_url')->nullable();
            $table->boolean('is_active')->default(true);
            $table->boolean('is_serialized')->default(false);
            $table->integer('warranty_period')->nullable(); // in months
            $table->timestamps();
            
            $table->foreign('category_id')->references('id')->on('categories')->onDelete('set null');
            $table->foreign('supplier_id')->references('id')->on('suppliers')->onDelete('set null');
            
            $table->index(['sku', 'is_active']);
            $table->index('barcode');
            $table->index(['category_id', 'is_active']);
            $table->index(['supplier_id', 'is_active']);
            $table->index('stock_quantity');
        });
    }
};

// database/migrations/2024_01_01_000006_create_product_serials_table.php
return new class extends Migration
{
    public function up()
    {
        Schema::create('product_serials', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('product_id');
            $table->string('serial_number')->unique();
            $table->enum('status', ['available', 'sold', 'defective', 'returned'])->default('available');
            $table->timestamp('sold_at')->nullable();
            $table->timestamp('warranty_expires_at')->nullable();
            $table->timestamps();
            
            $table->foreign('product_id')->references('id')->on('products')->onDelete('cascade');
            $table->index(['product_id', 'status']);
            $table->index('serial_number');
        });
    }
};

// database/migrations/2024_01_01_000007_create_transactions_table.php
return new class extends Migration
{
    public function up()
    {
        Schema::create('transactions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('transaction_number', 50)->unique();
            $table->uuid('customer_id')->nullable();
            $table->uuid('cashier_id');
            $table->enum('transaction_type', ['sale', 'return', 'exchange', 'void'])->default('sale');
            $table->decimal('subtotal', 12, 2);
            $table->decimal('tax_amount', 12, 2);
            $table->decimal('discount_amount', 12, 2)->default(0);
            $table->decimal('total_amount', 12, 2);
            $table->enum('payment_method', ['cash', 'credit_card', 'debit_card', 'gcash', 'paymaya', 'bank_transfer']);
            $table->string('payment_reference')->nullable();
            $table->decimal('change_amount', 12, 2)->default(0);
            $table->enum('status', ['pending', 'completed', 'cancelled', 'refunded'])->default('completed');
            $table->text('notes')->nullable();
            $table->timestamp('transaction_date');
            $table->timestamps();
            
            $table->foreign('customer_id')->references('id')->on('customers')->onDelete('set null');
            $table->foreign('cashier_id')->references('id')->on('users')->onDelete('restrict');
            
            $table->index(['transaction_number']);
            $table->index(['transaction_date', 'status']);
            $table->index(['cashier_id', 'transaction_date']);
            $table->index(['customer_id', 'transaction_date']);
        });
    }
};

// database/migrations/2024_01_01_000008_create_transaction_items_table.php
return new class extends Migration
{
    public function up()
    {
        Schema::create('transaction_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('transaction_id');
            $table->uuid('product_id');
            $table->uuid('product_serial_id')->nullable();
            $table->integer('quantity');
            $table->decimal('unit_price', 10, 2);
            $table->decimal('discount_amount', 10, 2)->default(0);
            $table->decimal('line_total', 12, 2);
            $table->timestamps();
            
            $table->foreign('transaction_id')->references('id')->on('transactions')->onDelete('cascade');
            $table->foreign('product_id')->references('id')->on('products')->onDelete('restrict');
            $table->foreign('product_serial_id')->references('id')->on('product_serials')->onDelete('set null');
            
            $table->index('transaction_id');
            $table->index('product_id');
        });
    }
};

// database/migrations/2024_01_01_000009_create_purchase_orders_table.php
return new class extends Migration
{
    public function up()
    {
        Schema::create('purchase_orders', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('po_number', 50)->unique();
            $table->uuid('supplier_id');
            $table->uuid('created_by');
            $table->date('order_date');
            $table->date('expected_delivery_date')->nullable();
            $table->date('actual_delivery_date')->nullable();
            $table->decimal('subtotal', 12, 2);
            $table->decimal('tax_amount', 12, 2)->default(0);
            $table->decimal('total_amount', 12, 2);
            $table->enum('status', ['pending', 'approved', 'ordered', 'partially_received', 'received', 'cancelled'])->default('pending');
            $table->text('notes')->nullable();
            $table->timestamps();
            
            $table->foreign('supplier_id')->references('id')->on('suppliers')->onDelete('restrict');
            $table->foreign('created_by')->references('id')->on('users')->onDelete('restrict');
            
            $table->index(['po_number']);
            $table->index(['supplier_id', 'status']);
            $table->index(['order_date', 'status']);
        });
    }
};

// database/migrations/2024_01_01_000010_create_purchase_order_items_table.php
return new class extends Migration
{
    public function up()
    {
        Schema::create('purchase_order_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('purchase_order_id');
            $table->uuid('product_id');
            $table->integer('quantity_ordered');
            $table->integer('quantity_received')->default(0);
            $table->decimal('unit_cost', 10, 2);
            $table->decimal('line_total', 12, 2);
            $table->timestamps();
            
            $table->foreign('purchase_order_id')->references('id')->on('purchase_orders')->onDelete('cascade');
            $table->foreign('product_id')->references('id')->on('products')->onDelete('restrict');
            
            $table->index('purchase_order_id');
            $table->index('product_id');
        });
    }
};

// database/migrations/2024_01_01_000011_create_repairs_table.php
return new class extends Migration
{
    public function up()
    {
        Schema::create('repairs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('repair_number', 50)->unique();
            $table->uuid('customer_id');
            $table->uuid('technician_id')->nullable();
            $table->string('device_type');
            $table->string('device_brand')->nullable();
            $table->string('device_model')->nullable();
            $table->string('serial_number')->nullable();
            $table->text('issue_description');
            $table->text('diagnosis')->nullable();
            $table->text('repair_notes')->nullable();
            $table->decimal('estimated_cost', 10, 2)->nullable();
            $table->decimal('actual_cost', 10, 2)->nullable();
            $table->decimal('labor_cost', 10, 2)->nullable();
            $table->decimal('parts_cost', 10, 2)->nullable();
            $table->enum('status', ['received', 'diagnosed', 'waiting_approval', 'in_progress', 'waiting_parts', 'completed', 'ready_pickup', 'delivered', 'cancelled'])->default('received');
            $table->enum('priority', ['low', 'normal', 'high', 'urgent'])->default('normal');
            $table->timestamp('received_date');
            $table->timestamp('estimated_completion_date')->nullable();
            $table->timestamp('actual_completion_date')->nullable();
            $table->integer('warranty_period')->default(30); // days
            $table->timestamps();
            
            $table->foreign('customer_id')->references('id')->on('customers')->onDelete('restrict');
            $table->foreign('technician_id')->references('id')->on('users')->onDelete('set null');
            
            $table->index(['repair_number']);
            $table->index(['customer_id', 'status']);
            $table->index(['technician_id', 'status']);
            $table->index(['status', 'priority']);
        });
    }
};

// database/migrations/2024_01_01_000012_create_repair_parts_table.php
return new class extends Migration
{
    public function up()
    {
        Schema::create('repair_parts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('repair_id');
            $table->uuid('product_id');
            $table->integer('quantity_used');
            $table->decimal('unit_cost', 10, 2);
            $table->decimal('line_total', 12, 2);
            $table->timestamps();
            
            $table->foreign('repair_id')->references('id')->on('repairs')->onDelete('cascade');
            $table->foreign('product_id')->references('id')->on('products')->onDelete('restrict');
            
            $table->index('repair_id');
            $table->index('product_id');
        });
    }
};

// database/migrations/2024_01_01_000013_create_inventory_movements_table.php
return new class extends Migration
{
    public function up()
    {
        Schema::create('inventory_movements', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('product_id');
            $table->enum('movement_type', ['sale', 'purchase', 'adjustment', 'return', 'damage', 'transfer']);
            $table->integer('quantity');
            $table->uuid('reference_id')->nullable(); // Can reference transaction_id, purchase_order_id, etc.
            $table->string('reference_type', 50)->nullable();
            $table->text('notes')->nullable();
            $table->uuid('created_by')->nullable();
            $table->timestamps();
            
            $table->foreign('product_id')->references('id')->on('products')->onDelete('restrict');
            $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');
            
            $table->index(['product_id', 'created_at']);
            $table->index(['movement_type', 'created_at']);
            $table->index(['reference_id', 'reference_type']);
        });
    }
};

// database/migrations/2024_01_01_000014_create_audit_logs_table.php
return new class extends Migration
{
    public function up()
    {
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id')->nullable();
            $table->string('action', 100);
            $table->string('table_name', 100);
            $table->uuid('record_id')->nullable();
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();
            $table->ipAddress('ip_address')->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamps();
            
            $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
            
            $table->index(['user_id', 'created_at']);
            $table->index(['table_name', 'action']);
            $table->index('created_at');
        });
    }
};
```

### Laravel Eloquent Models

```php
<?php
// app/Models/User.php
namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, HasUuids, HasRoles;

    protected $fillable = [
        'email',
        'password',
        'first_name',
        'last_name',
        'role',
        'is_active',
        'last_login_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'last_login_at' => 'datetime',
        'is_active' => 'boolean',
        'password' => 'hashed',
    ];

    // Relationships
    public function transactions()
    {
        return $this->hasMany(Transaction::class, 'cashier_id');
    }

    public function purchaseOrders()
    {
        return $this->hasMany(PurchaseOrder::class, 'created_by');
    }

    public function repairs()
    {
        return $this->hasMany(Repair::class, 'technician_id');
    }

    public function auditLogs()
    {
        return $this->hasMany(AuditLog::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeByRole($query, $role)
    {
        return $query->where('role', $role);
    }

    // Accessors
    public function getFullNameAttribute()
    {
        return "{$this->first_name} {$this->last_name}";
    }
}

// app/Models/Product.php
namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'sku',
        'barcode',
        'name',
        'description',
        'category_id',
        'supplier_id',
        'brand',
        'model',
        'cost_price',
        'selling_price',
        'markup_percentage',
        'tax_rate',
        'stock_quantity',
        'reorder_level',
        'max_stock_level',
        'unit_of_measure',
        'weight',
        'dimensions',
        'image_url',
        'is_active',
        'is_serialized',
        'warranty_period',
    ];

    protected $casts = [
        'cost_price' => 'decimal:2',
        'selling_price' => 'decimal:2',
        'markup_percentage' => 'decimal:2',
        'tax_rate' => 'decimal:2',
        'weight' => 'decimal:2',
        'is_active' => 'boolean',
        'is_serialized' => 'boolean',
    ];

    // Relationships
    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function serials()
    {
        return $this->hasMany(ProductSerial::class);
    }

    public function transactionItems()
    {
        return $this->hasMany(TransactionItem::class);
    }

    public function purchaseOrderItems()
    {
        return $this->hasMany(PurchaseOrderItem::class);
    }

    public function inventoryMovements()
    {
        return $this->hasMany(InventoryMovement::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeLowStock($query)
    {
        return $query->whereColumn('stock_quantity', '<=', 'reorder_level');
    }

    public function scopeInStock($query)
    {
        return $query->where('stock_quantity', '>', 0);
    }

    public function scopeByCategory($query, $categoryId)
    {
        return $query->where('category_id', $categoryId);
    }

    // Accessors
    public function getIsLowStockAttribute()
    {
        return $this->stock_quantity <= $this->reorder_level;
    }

    public function getProfitMarginAttribute()
    {
        return $this->selling_price - $this->cost_price;
    }

    public function getProfitPercentageAttribute()
    {
        if ($this->cost_price == 0) return 0;
        return (($this->selling_price - $this->cost_price) / $this->cost_price) * 100;
    }
}

// app/Models/Transaction.php
namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Transaction extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'transaction_number',
        'customer_id',
        'cashier_id',
        'transaction_type',
        'subtotal',
        'tax_amount',
        'discount_amount',
        'total_amount',
        'payment_method',
        'payment_reference',
        'change_amount',
        'status',
        'notes',
        'transaction_date',
    ];

    protected $casts = [
        'subtotal' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'change_amount' => 'decimal:2',
        'transaction_date' => 'datetime',
    ];

    // Relationships
    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function cashier()
    {
        return $this->belongsTo(User::class, 'cashier_id');
    }

    public function items()
    {
        return $this->hasMany(TransactionItem::class);
    }

    // Scopes
    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    public function scopeToday($query)
    {
        return $query->whereDate('transaction_date', today());
    }

    public function scopeThisWeek($query)
    {
        return $query->whereBetween('transaction_date', [
            now()->startOfWeek(),
            now()->endOfWeek()
        ]);
    }

    public function scopeThisMonth($query)
    {
        return $query->whereMonth('transaction_date', now()->month)
                    ->whereYear('transaction_date', now()->year);
    }

    // Accessors
    public function getTotalItemsAttribute()
    {
        return $this->items->sum('quantity');
    }
}
```

---

## 2. Laravel Backend API Architecture

### Laravel API Structure

```php
<?php
// routes/api.php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\{
    AuthController,
    UserController,
    CustomerController,
    ProductController,
    TransactionController,
    PurchaseOrderController,
    RepairController,
    DashboardController,
    ReportController
};

// Authentication routes
Route::prefix('auth')->group(function () {
    Route::post('login', [AuthController::class, 'login']);
    Route::post('register', [AuthController::class, 'register']);
    Route::post('forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('reset-password', [AuthController::class, 'resetPassword']);
    
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::get('me', [AuthController::class, 'me']);
        Route::post('refresh', [AuthController::class, 'refresh']);
    });
});

// Protected API routes
Route::middleware(['auth:sanctum'])->group(function () {
    
    // User Management
    Route::apiResource('users', UserController::class);
    Route::put('users/{user}/password', [UserController::class, 'updatePassword']);
    Route::put('users/{user}/role', [UserController::class, 'updateRole']);
    
    // Customer Management
    Route::apiResource('customers', CustomerController::class);
    Route::get('customers/{customer}/transactions', [CustomerController::class, 'transactions']);
    Route::get('customers/{customer}/repairs', [CustomerController::class, 'repairs']);
    Route::get('customers/search', [CustomerController::class, 'search']);
    
    // Product & Inventory Management
    Route::apiResource('products', ProductController::class);
    Route::get('products/search', [ProductController::class, 'search']);
    Route::get('products/barcode/{barcode}', [ProductController::class, 'findByBarcode']);
    Route::post('products/{product}/adjust-stock', [ProductController::class, 'adjustStock']);
    Route::get('products/low-stock', [ProductController::class, 'lowStock']);
    Route::get('products/categories', [ProductController::class, 'categories']);
    Route::post('products/categories', [ProductController::class, 'createCategory']);
    Route::get('products/suppliers', [ProductController::class, 'suppliers']);
    Route::post('products/suppliers', [ProductController::class, 'createSupplier']);
    
    // Transaction Management
    Route::apiResource('transactions', TransactionController::class);
    Route::post('transactions/{transaction}/refund', [TransactionController::class, 'refund']);
    Route::get('transactions/daily-summary', [TransactionController::class, 'dailySummary']);
    Route::get('transactions/search', [TransactionController::class, 'search']);
    
    // Purchase Order Management
    Route::apiResource('purchase-orders', PurchaseOrderController::class);
    Route::post('purchase-orders/{purchaseOrder}/receive', [PurchaseOrderController::class, 'receive']);
    Route::get('purchase-orders/{purchaseOrder}/items', [PurchaseOrderController::class, 'items']);
    
    // Repair Management
    Route::apiResource('repairs', RepairController::class);
    Route::post('repairs/{repair}/status', [RepairController::class, 'updateStatus']);
    Route::get('repairs/pending', [RepairController::class, 'pending']);
    Route::get('repairs/completed', [RepairController::class, 'completed']);
    
    // Dashboard & Analytics
    Route::prefix('dashboard')->group(function () {
        Route::get('metrics', [DashboardController::class, 'metrics']);
        Route::get('recent-activity', [DashboardController::class, 'recentActivity']);
        Route::get('low-stock', [DashboardController::class, 'lowStock']);
        Route::get('top-selling', [DashboardController::class, 'topSelling']);
        Route::get('pending-repairs', [DashboardController::class, 'pendingRepairs']);
    });
    
    // Reports
    Route::prefix('reports')->group(function () {
        Route::get('sales', [ReportController::class, 'sales']);
        Route::get('inventory', [ReportController::class, 'inventory']);
        Route::get('customers', [ReportController::class, 'customers']);
        Route::get('repairs', [ReportController::class, 'repairs']);
        Route::post('custom', [ReportController::class, 'custom']);
        Route::get('export/{report}', [ReportController::class, 'export']);
    });
});

// app/Http/Controllers/Api/ProductController.php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ProductRequest;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use App\Services\ProductService;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function __construct(
        private ProductService $productService
    ) {}

    public function index(Request $request)
    {
        $products = Product::query()
            ->with(['category', 'supplier'])
            ->when($request->category_id, fn($q) => $q->byCategory($request->category_id))
            ->when($request->search, fn($q) => $q->where('name', 'like', "%{$request->search}%"))
            ->when($request->low_stock, fn($q) => $q->lowStock())
            ->active()
            ->paginate($request->per_page ?? 15);

        return ProductResource::collection($products);
    }

    public function store(ProductRequest $request)
    {
        $product = $this->productService->create($request->validated());
        
        return new ProductResource($product);
    }

    public function show(Product $product)
    {
        $product->load(['category', 'supplier', 'inventoryMovements.user']);
        
        return new ProductResource($product);
    }

    public function update(ProductRequest $request, Product $product)
    {
        $product = $this->productService->update($product, $request->validated());
        
        return new ProductResource($product);
    }

    public function destroy(Product $product)
    {
        $this->productService->delete($product);
        
        return response()->json(['message' => 'Product deleted successfully']);
    }

    public function findByBarcode(string $barcode)
    {
        $product = Product::where('barcode', $barcode)->active()->first();
        
        if (!$product) {
            return response()->json(['message' => 'Product not found'], 404);
        }
        
        return new ProductResource($product);
    }

    public function adjustStock(Request $request, Product $product)
    {
        $request->validate([
            'quantity' => 'required|integer',
            'type' => 'required|in:increase,decrease,set',
            'notes' => 'nullable|string|max:255'
        ]);

        $product = $this->productService->adjustStock(
            $product,
            $request->quantity,
            $request->type,
            $request->notes
        );

        return new ProductResource($product);
    }

    public function lowStock()
    {
        $products = Product::lowStock()
            ->with(['category', 'supplier'])
            ->active()
            ->get();

        return ProductResource::collection($products);
    }

    public function search(Request $request)
    {
        $request->validate([
            'q' => 'required|string|min:2'
        ]);

        $products = Product::where('name', 'like', "%{$request->q}%")
            ->orWhere('sku', 'like', "%{$request->q}%")
            ->orWhere('barcode', 'like', "%{$request->q}%")
            ->with(['category', 'supplier'])
            ->active()
            ->limit(20)
            ->get();

        return ProductResource::collection($products);
    }
}

// app/Http/Controllers/Api/TransactionController.php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\TransactionRequest;
use App\Http\Resources\TransactionResource;
use App\Models\Transaction;
use App\Services\TransactionService;
use Illuminate\Http\Request;

class TransactionController extends Controller
{
    public function __construct(
        private TransactionService $transactionService
    ) {}

    public function index(Request $request)
    {
        $transactions = Transaction::query()
            ->with(['customer', 'cashier', 'items.product'])
            ->when($request->date_from, fn($q) => $q->whereDate('transaction_date', '>=', $request->date_from))
            ->when($request->date_to, fn($q) => $q->whereDate('transaction_date', '<=', $request->date_to))
            ->when($request->payment_method, fn($q) => $q->where('payment_method', $request->payment_method))
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->when($request->cashier_id, fn($q) => $q->where('cashier_id', $request->cashier_id))
            ->orderBy('transaction_date', 'desc')
            ->paginate($request->per_page ?? 15);

        return TransactionResource::collection($transactions);
    }

    public function store(TransactionRequest $request)
    {
        $transaction = $this->transactionService->create($request->validated());
        
        return new TransactionResource($transaction);
    }

    public function show(Transaction $transaction)
    {
        $transaction->load(['customer', 'cashier', 'items.product']);
        
        return new TransactionResource($transaction);
    }

    public function refund(Request $request, Transaction $transaction)
    {
        $request->validate([
            'amount' => 'required|numeric|min:0.01|max:' . $transaction->total_amount,
            'reason' => 'required|string|max:255'
        ]);

        $refund = $this->transactionService->refund(
            $transaction,
            $request->amount,
            $request->reason
        );

        return response()->json([
            'message' => 'Refund processed successfully',
            'refund' => $refund
        ]);
    }

    public function dailySummary(Request $request)
    {
        $date = $request->date ?? today();
        $summary = $this->transactionService->getDailySummary($date);
        
        return response()->json($summary);
    }
}

// app/Services/ProductService.php
namespace App\Services;

use App\Models\Product;
use App\Models\InventoryMovement;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ProductService
{
    public function create(array $data): Product
    {
        return DB::transaction(function () use ($data) {
            // Generate SKU if not provided
            if (!isset($data['sku'])) {
                $data['sku'] = $this->generateSKU($data['name']);
            }

            $product = Product::create($data);

            // Create initial inventory movement if stock is provided
            if (isset($data['stock_quantity']) && $data['stock_quantity'] > 0) {
                InventoryMovement::create([
                    'product_id' => $product->id,
                    'movement_type' => 'adjustment',
                    'quantity' => $data['stock_quantity'],
                    'notes' => 'Initial stock',
                    'created_by' => auth()->id()
                ]);
            }

            return $product->load(['category', 'supplier']);
        });
    }

    public function update(Product $product, array $data): Product
    {
        return DB::transaction(function () use ($product, $data) {
            $oldStock = $product->stock_quantity;
            
            $product->update($data);

            // Track stock changes
            if (isset($data['stock_quantity']) && $data['stock_quantity'] != $oldStock) {
                $difference = $data['stock_quantity'] - $oldStock;
                
                InventoryMovement::create([
                    'product_id' => $product->id,
                    'movement_type' => 'adjustment',
                    'quantity' => $difference,
                    'notes' => 'Stock adjustment via product update',
                    'created_by' => auth()->id()
                ]);
            }

            return $product->load(['category', 'supplier']);
        });
    }

    public function adjustStock(Product $product, int $quantity, string $type, ?string $notes = null): Product
    {
        return DB::transaction(function () use ($product, $quantity, $type, $notes) {
            $oldStock = $product->stock_quantity;
            
            switch ($type) {
                case 'increase':
                    $newStock = $oldStock + $quantity;
                    $movementQuantity = $quantity;
                    break;
                case 'decrease':
                    $newStock = max(0, $oldStock - $quantity);
                    $movementQuantity = -$quantity;
                    break;
                case 'set':
                    $newStock = $quantity;
                    $movementQuantity = $quantity - $oldStock;
                    break;
                default:
                    throw new \InvalidArgumentException('Invalid adjustment type');
            }

            $product->update(['stock_quantity' => $newStock]);

            // Record inventory movement
            InventoryMovement::create([
                'product_id' => $product->id,
                'movement_type' => 'adjustment',
                'quantity' => $movementQuantity,
                'notes' => $notes ?? "Stock {$type}",
                'created_by' => auth()->id()
            ]);

            return $product->fresh();
        });
    }

    private function generateSKU(string $name): string
    {
        $prefix = strtoupper(substr(preg_replace('/[^A-Za-z]/', '', $name), 0, 3));
        $suffix = str_pad(Product::count() + 1, 4, '0', STR_PAD_LEFT);
        
        return $prefix . '-' . $suffix;
    }
}

// app/Services/TransactionService.php
namespace App\Services;

use App\Models\Transaction;
use App\Models\TransactionItem;
use App\Models\Product;
use App\Models\InventoryMovement;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class TransactionService
{
    public function create(array $data): Transaction
    {
        return DB::transaction(function () use ($data) {
            // Generate transaction number
            $transactionNumber = $this->generateTransactionNumber();
            
            // Calculate totals
            $subtotal = collect($data['items'])->sum(fn($item) => $item['quantity'] * $item['unit_price']);
            $taxAmount = $subtotal * ($data['tax_rate'] ?? 0.12);
            $discountAmount = $data['discount_amount'] ?? 0;
            $totalAmount = $subtotal + $taxAmount - $discountAmount;

            // Create transaction
            $transaction = Transaction::create([
                'transaction_number' => $transactionNumber,
                'customer_id' => $data['customer_id'] ?? null,
                'cashier_id' => auth()->id(),
                'transaction_type' => $data['transaction_type'] ?? 'sale',
                'subtotal' => $subtotal,
                'tax_amount' => $taxAmount,
                'discount_amount' => $discountAmount,
                'total_amount' => $totalAmount,
                'payment_method' => $data['payment_method'],
                'payment_reference' => $data['payment_reference'] ?? null,
                'change_amount' => $data['change_amount'] ?? 0,
                'status' => 'completed',
                'notes' => $data['notes'] ?? null,
                'transaction_date' => now(),
            ]);

            // Create transaction items and update inventory
            foreach ($data['items'] as $itemData) {
                $product = Product::findOrFail($itemData['product_id']);
                
                // Create transaction item
                TransactionItem::create([
                    'transaction_id' => $transaction->id,
                    'product_id' => $product->id,
                    'product_serial_id' => $itemData['product_serial_id'] ?? null,
                    'quantity' => $itemData['quantity'],
                    'unit_price' => $itemData['unit_price'],
                    'discount_amount' => $itemData['discount_amount'] ?? 0,
                    'line_total' => $itemData['quantity'] * $itemData['unit_price'] - ($itemData['discount_amount'] ?? 0),
                ]);

                // Update product stock
                $product->decrement('stock_quantity', $itemData['quantity']);

                // Record inventory movement
                InventoryMovement::create([
                    'product_id' => $product->id,
                    'movement_type' => 'sale',
                    'quantity' => -$itemData['quantity'],
                    'reference_id' => $transaction->id,
                    'reference_type' => 'transaction',
                    'created_by' => auth()->id()
                ]);
            }

            return $transaction->load(['customer', 'cashier', 'items.product']);
        });
    }

    public function getDailySummary(Carbon $date): array
    {
        $transactions = Transaction::whereDate('transaction_date', $date)
            ->completed()
            ->get();

        return [
            'date' => $date->toDateString(),
            'total_transactions' => $transactions->count(),
            'total_revenue' => $transactions->sum('total_amount'),
            'total_items_sold' => $transactions->sum('total_items'),
            'average_transaction_value' => $transactions->avg('total_amount'),
            'payment_methods' => $transactions->groupBy('payment_method')
                ->map(fn($group) => [
                    'count' => $group->count(),
                    'total' => $group->sum('total_amount')
                ]),
            'hourly_sales' => $transactions->groupBy(fn($t) => $t->transaction_date->format('H'))
                ->map(fn($group) => [
                    'transactions' => $group->count(),
                    'revenue' => $group->sum('total_amount')
                ])
        ];
    }

    private function generateTransactionNumber(): string
    {
        $date = now()->format('Ymd');
        $sequence = str_pad(Transaction::whereDate('created_at', today())->count() + 1, 4, '0', STR_PAD_LEFT);
        
        return "TXN-{$date}-{$sequence}";
    }
}
```

---

## 3. Laravel Authentication & Authorization

### Laravel Sanctum Setup

```php
<?php
// app/Http/Controllers/Api/AuthController.php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(LoginRequest $request)
    {
        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        if (!$user->is_active) {
            throw ValidationException::withMessages([
                'email' => ['Your account has been deactivated.'],
            ]);
        }

        // Update last login
        $user->update(['last_login_at' => now()]);

        // Create token
        $token = $user->createToken('pos-token', $this->getTokenAbilities($user->role))->plainTextToken;

        return response()->json([
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
                'full_name' => $user->full_name,
                'role' => $user->role,
                'permissions' => $this->getUserPermissions($user->role)
            ],
            'token' => $token,
            'token_type' => 'Bearer'
        ]);
    }

    public function register(RegisterRequest $request)
    {
        $user = User::create([
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'role' => $request->role ?? 'cashier'
        ]);

        $token = $user->createToken('pos-token', $this->getTokenAbilities($user->role))->plainTextToken;

        return response()->json([
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
                'full_name' => $user->full_name,
                'role' => $user->role,
                'permissions' => $this->getUserPermissions($user->role)
            ],
            'token' => $token,
            'token_type' => 'Bearer'
        ], 201);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully']);
    }

    public function me(Request $request)
    {
        $user = $request->user();
        
        return response()->json([
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
                'full_name' => $user->full_name,
                'role' => $user->role,
                'permissions' => $this->getUserPermissions($user->role),
                'last_login_at' => $user->last_login_at
            ]
        ]);
    }

    private function getTokenAbilities(string $role): array
    {
        return match($role) {
            'admin' => ['*'],
            'manager' => [
                'dashboard:read',
                'pos:create', 'pos:read', 'pos:update',
                'inventory:create', 'inventory:read', 'inventory:update', 'inventory:delete',
                'customers:create', 'customers:read', 'customers:update', 'customers:delete',
                'transactions:read', 'transactions:update',
                'purchase_orders:create', 'purchase_orders:read', 'purchase_orders:update', 'purchase_orders:delete',
                'repairs:create', 'repairs:read', 'repairs:update', 'repairs:delete',
                'reports:read'
            ],
            'cashier' => [
                'dashboard:read',
                'pos:create', 'pos:read',
                'inventory:read',
                'customers:create', 'customers:read', 'customers:update',
                'transactions:read'
            ],
            'technician' => [
                'dashboard:read',
                'repairs:read', 'repairs:update',
                'inventory:read',
                'customers:read'
            ],
            default => []
        };
    }

    private function getUserPermissions(string $role): array
    {
        $abilities = $this->getTokenAbilities($role);
        
        if (in_array('*', $abilities)) {
            return ['*'];
        }
        
        return $abilities;
    }
}

// app/Http/Middleware/CheckPermission.php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CheckPermission
{
    public function handle(Request $request, Closure $next, string $permission)
    {
        $user = $request->user();
        
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        // Check if user has the specific permission or wildcard permission
        if (!$user->tokenCan($permission) && !$user->tokenCan('*')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        return $next($request);
    }
}

// app/Http/Requests/LoginRequest.php
namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'email' => 'required|email',
            'password' => 'required|string|min:8'
        ];
    }
}

// app/Http/Requests/ProductRequest.php
namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ProductRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        $productId = $this->route('product')?->id;
        
        return [
            'sku' => 'required|string|max:100|unique:products,sku,' . $productId,
            'barcode' => 'nullable|string|max:100|unique:products,barcode,' . $productId,
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'category_id' => 'nullable|exists:categories,id',
            'supplier_id' => 'nullable|exists:suppliers,id',
            'brand' => 'nullable|string|max:255',
            'model' => 'nullable|string|max:255',
            'cost_price' => 'required|numeric|min:0',
            'selling_price' => 'required|numeric|min:0',
            'tax_rate' => 'nullable|numeric|min:0|max:1',
            'stock_quantity' => 'required|integer|min:0',
            'reorder_level' => 'required|integer|min:0',
            'max_stock_level' => 'nullable|integer|min:0',
            'unit_of_measure' => 'nullable|string|max:50',
            'weight' => 'nullable|numeric|min:0',
            'dimensions' => 'nullable|string|max:100',
            'image_url' => 'nullable|url',
            'is_active' => 'boolean',
            'is_serialized' => 'boolean',
            'warranty_period' => 'nullable|integer|min:0'
        ];
    }
}
```

---

## 4. Real-time Updates with Laravel WebSockets

### WebSocket Implementation

```php
<?php
// config/websockets.php
return [
    'dashboard' => [
        'port' => env('LARAVEL_WEBSOCKETS_PORT', 6001),
    ],
    
    'apps' => [
        [
            'id' => env('PUSHER_APP_ID'),
            'name' => env('APP_NAME'),
            'key' => env('PUSHER_APP_KEY'),
            'secret' => env('PUSHER_APP_SECRET'),
            'path' => env('PUSHER_APP_PATH'),
            'capacity' => null,
            'enable_client_messages' => false,
            'enable_statistics' => true,
        ],
    ],
    
    'app_provider' => BeyondCode\LaravelWebSockets\Apps\ConfigAppProvider::class,
    'allowed_origins' => [
        env('FRONTEND_URL', 'http://localhost:3000'),
    ],
    'max_request_size_in_kb' => 250,
    'path' => 'laravel-websockets',
    'middleware' => [
        'web',
        BeyondCode\LaravelWebSockets\Dashboard\Http\Middleware\Authorize::class,
    ],
    'statistics' => [
        'model' => \BeyondCode\LaravelWebSockets\Statistics\Models\WebSocketsStatisticsEntry::class,
        'logger' => BeyondCode\LaravelWebSockets\Statistics\Logger\HttpStatisticsLogger::class,
        'interval_in_seconds' => 60,
        'delete_statistics_older_than_days' => 60,
        'perform_dns_lookup' => false,
    ],
    'ssl' => [
        'local_cert' => env('LARAVEL_WEBSOCKETS_SSL_LOCAL_CERT', null),
        'local_pk' => env('LARAVEL_WEBSOCKETS_SSL_LOCAL_PK', null),
        'passphrase' => env('LARAVEL_WEBSOCKETS_SSL_PASSPHRASE', null),
    ],
    'channel_manager' => \BeyondCode\LaravelWebSockets\WebSockets\Channels\ChannelManagers\ArrayChannelManager::class,
];

// app/Events/InventoryUpdated.php
namespace App\Events;

use App\Models\Product;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class InventoryUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Product $product,
        public int $oldStock,
        public int $newStock,
        public string $reason
    ) {}

    public function broadcastOn()
    {
        return new Channel('inventory-updates');
    }

    public function broadcastWith()
    {
        return [
            'product_id' => $this->product->id,
            'product_name' => $this->product->name,
            'sku' => $this->product->sku,
            'old_stock' => $this->oldStock,
            'new_stock' => $this->newStock,
            'reorder_level' => $this->product->reorder_level,
            'reason' => $this->reason,
            'is_low_stock' => $this->newStock <= $this->product->reorder_level,
            'timestamp' => now()->toISOString()
        ];
    }
}

// app/Events/TransactionCompleted.php
namespace App\Events;

use App\Models\Transaction;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TransactionCompleted implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Transaction $transaction) {}

    public function broadcastOn()
    {
        return new Channel('transaction-updates');
    }

    public function broadcastWith()
    {
        return [
            'transaction_id' => $this->transaction->id,
            'transaction_number' => $this->transaction->transaction_number,
            'total_amount' => $this->transaction->total_amount,
            'payment_method' => $this->transaction->payment_method,
            'customer_name' => $this->transaction->customer?->full_name,
            'cashier_name' => $this->transaction->cashier->full_name,
            'items_count' => $this->transaction->total_items,
            'timestamp' => $this->transaction->transaction_date->toISOString()
        ];
    }
}

// app/Observers/ProductObserver.php
namespace App\Observers;

use App\Models\Product;
use App\Events\InventoryUpdated;

class ProductObserver
{
    public function updating(Product $product)
    {
        // Store original stock quantity for comparison
        $product->original_stock = $product->getOriginal('stock_quantity');
    }

    public function updated(Product $product)
    {
        // Check if stock quantity changed
        if ($product->isDirty('stock_quantity')) {
            $oldStock = $product->original_stock ?? 0;
            $newStock = $product->stock_quantity;
            
            // Broadcast inventory update
            broadcast(new InventoryUpdated(
                $product,
                $oldStock,
                $newStock,
                'Stock updated'
            ));
        }
    }
}

// app/Providers/EventServiceProvider.php
namespace App\Providers;

use App\Models\Product;
use App\Observers\ProductObserver;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

class EventServiceProvider extends ServiceProvider
{
    protected $listen = [
        // Event listeners
    ];

    public function boot()
    {
        Product::observe(ProductObserver::class);
    }
}
```

### Next.js Real-time Integration

```typescript
// lib/pusher.ts
import Pusher from 'pusher-js';

const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  wsHost: process.env.NEXT_PUBLIC_PUSHER_HOST,
  wsPort: parseInt(process.env.NEXT_PUBLIC_PUSHER_PORT || '6001'),
  wssPort: parseInt(process.env.NEXT_PUBLIC_PUSHER_PORT || '6001'),
  forceTLS: process.env.NODE_ENV === 'production',
  enabledTransports: ['ws', 'wss'],
  auth: {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`
    }
  }
});

export default pusher;

// hooks/useRealtimeInventory.ts
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import pusher from '@/lib/pusher';
import { toast } from 'sonner';

interface InventoryUpdate {
  product_id: string;
  product_name: string;
  sku: string;
  old_stock: number;
  new_stock: number;
  reorder_level: number;
  reason: string;
  is_low_stock: boolean;
  timestamp: string;
}

export function useRealtimeInventory() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = pusher.subscribe('inventory-updates');
    
    channel.bind('App\\Events\\InventoryUpdated', (data: InventoryUpdate) => {
      // Update React Query cache
      queryClient.setQueryData(['products'], (oldData: any) => {
        if (!oldData) return oldData;
        
        return {
          ...oldData,
          data: oldData.data.map((product: any) =>
            product.id === data.product_id
              ? { ...product, stock_quantity: data.new_stock }
              : product
          )
        };
      });

      // Update individual product cache
      queryClient.setQueryData(['products', data.product_id], (oldData: any) => {
        if (!oldData) return oldData;
        return { ...oldData, stock_quantity: data.new_stock };
      });

      // Show low stock notification
      if (data.is_low_stock) {
        toast.warning(`Low Stock Alert: ${data.product_name} (${data.new_stock} remaining)`);
      }

      // Invalidate related queries
      queryClient.invalidateQueries(['dashboard', 'low-stock']);
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe('inventory-updates');
    };
  }, [queryClient]);
}

// hooks/useRealtimeTransactions.ts
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import pusher from '@/lib/pusher';
import { toast } from 'sonner';

interface TransactionUpdate {
  transaction_id: string;
  transaction_number: string;
  total_amount: number;
  payment_method: string;
  customer_name?: string;
  cashier_name: string;
  items_count: number;
  timestamp: string;
}

export function useRealtimeTransactions() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = pusher.subscribe('transaction-updates');
    
    channel.bind('App\\Events\\TransactionCompleted', (data: TransactionUpdate) => {
      // Update dashboard metrics
      queryClient.invalidateQueries(['dashboard', 'metrics']);
      
      // Add to recent transactions
      queryClient.setQueryData(['transactions', 'recent'], (oldData: any) => {
        if (!oldData) return oldData;
        
        const newTransaction = {
          id: data.transaction_id,
          transaction_number: data.transaction_number,
          total_amount: data.total_amount,
          payment_method: data.payment_method,
          customer_name: data.customer_name,
          cashier_name: data.cashier_name,
          items_count: data.items_count,
          created_at: data.timestamp
        };
        
        return {
          ...oldData,
          data: [newTransaction, ...oldData.data.slice(0, 9)]
        };
      });

      // Show success notification
      toast.success(`Transaction ${data.transaction_number} completed - ₱${data.total_amount.toFixed(2)}`);
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe('transaction-updates');
    };
  }, [queryClient]);
}

// components/RealtimeProvider.tsx
'use client';

import { useRealtimeInventory } from '@/hooks/useRealtimeInventory';
import { useRealtimeTransactions } from '@/hooks/useRealtimeTransactions';

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  useRealtimeInventory();
  useRealtimeTransactions();
  
  return <>{children}</>;
}
```

---

## 5. User Experience & Navigation Redesign

### Modern Navigation Patterns

```typescript
// components/navigation/AppNavigation.tsx
'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import {
  IconDashboard,
  IconShoppingCart,
  IconPackage,
  IconHistory,
  IconUsers,
  IconFileText,
  IconDeviceImacCog,
  IconMenu2,
  IconBell,
  IconSearch,
  IconSettings,
  IconLogout
} from '@tabler/icons-react';

interface NavigationItem {
  title: string;
  href: string;
  icon: React.ComponentType<any>;
  badge?: number;
  description?: string;
}

const navigationItems: NavigationItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: IconDashboard,
    description: 'Overview and analytics'
  },
  {
    title: 'Point of Sale',
    href: '/pos',
    icon: IconShoppingCart,
    description: 'Process transactions'
  },
  {
    title: 'Inventory',
    href: '/inventory',
    icon: IconPackage,
    badge: 5, // Low stock items
    description: 'Manage products and stock'
  },
  {
    title: 'Transactions',
    href: '/transactions',
    icon: IconHistory,
    description: 'View transaction history'
  },
  {
    title: 'Customers',
    href: '/customers',
    icon: IconUsers,
    description: 'Customer management'
  },
  {
    title: 'Purchase Orders',
    href: '/purchase-orders',
    icon: IconFileText,
    badge: 3, // Pending orders
    description: 'Supplier orders'
  },
  {
    title: 'Repairs',
    href: '/repairs',
    icon: IconDeviceImacCog,
    badge: 7, // Pending repairs
    description: 'Device repair tracking'
  }
];

export function AppNavigation() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const NavigationContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-4 border-b">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <span className="text-primary-foreground font-bold text-sm">G</span>
        </div>
        <span className="font-semibold text-lg">GTS Marketing</span>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                'hover:bg-accent hover:text-accent-foreground',
                isActive && 'bg-primary text-primary-foreground hover:bg-primary/90'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="flex-1">{item.title}</span>
              {item.badge && (
                <Badge variant={isActive ? 'secondary' : 'default'} className="ml-auto">
                  {item.badge}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="border-t px-4 py-4">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
            <span className="text-sm font-medium">JD</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">John Doe</p>
            <p className="text-xs text-muted-foreground">Manager</p>
          </div>
        </div>
        
        <div className="flex gap-1 mt-2">
          <Button variant="ghost" size="sm" className="flex-1">
            <IconSettings className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="flex-1">
            <IconLogout className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-72 lg:flex-col lg:fixed lg:inset-y-0 lg:border-r lg:bg-background">
        <NavigationContent />
      </div>

      {/* Mobile Navigation */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b bg-background">
          <div className="flex items-center gap-2">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  <IconMenu2 className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <NavigationContent />
              </SheetContent>
            </Sheet>
            <span className="font-semibold">GTS Marketing</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <IconSearch className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="sm">
              <IconBell className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom Tab Bar for Mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background border-t">
        <div className="flex">
          {navigationItems.slice(0, 5).map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex-1 flex flex-col items-center gap-1 px-2 py-2 text-xs',
                  'transition-colors relative',
                  isActive 
                    ? 'text-primary' 
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <div className="relative">
                  <Icon className="w-5 h-5" />
                  {item.badge && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-2 -right-2 w-4 h-4 p-0 text-xs"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </div>
                <span className="truncate max-w-full">{item.title}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}

// components/layout/PageHeader.tsx
interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

export function PageHeader({ title, description, actions, breadcrumbs }: PageHeaderProps) {
  return (
    <div className="border-b bg-background px-4 py-4 lg:px-6">
      {breadcrumbs && (
        <nav className="flex items-center space-x-1 text-sm text-muted-foreground mb-2">
          {breadcrumbs.map((crumb, index) => (
            <div key={index} className="flex items-center">
              {index > 0 && <span className="mx-2">/</span>}
              {crumb.href ? (
                <Link href={crumb.href} className="hover:text-foreground">
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-foreground">{crumb.label}</span>
              )}
            </div>
          ))}
        </nav>
      )}
      
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="text-muted-foreground">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

// components/layout/QuickActions.tsx
export function QuickActions() {
  const quickActions = [
    {
      title: 'New Sale',
      description: 'Start a new transaction',
      href: '/pos',
      icon: IconShoppingCart,
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      title: 'Add Product',
      description: 'Add new inventory item',
      href: '/inventory/new',
      icon: IconPackage,
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      title: 'New Customer',
      description: 'Register new customer',
      href: '/customers/new',
      icon: IconUsers,
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      title: 'New Repair',
      description: 'Create repair ticket',
      href: '/repairs/new',
      icon: IconDeviceImacCog,
      color: 'bg-orange-500 hover:bg-orange-600'
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {quickActions.map((action) => {
        const Icon = action.icon;
        
        return (
          <Link
            key={action.href}
            href={action.href}
            className="group relative overflow-hidden rounded-lg border p-4 hover:shadow-md transition-all"
          >
            <div className="flex items-start gap-3">
              <div className={cn('p-2 rounded-lg text-white', action.color)}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium group-hover:text-primary transition-colors">
                  {action.title}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {action.description}
                </p>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

// components/layout/NotificationCenter.tsx
export function NotificationCenter() {
  const notifications = [
    {
      id: '1',
      type: 'warning',
      title: 'Low Stock Alert',
      message: '5 products are running low on stock',
      time: '2 minutes ago',
      unread: true
    },
    {
      id: '2',
      type: 'success',
      title: 'Transaction Completed',
      message: 'Sale #TXN-20241201-0045 processed successfully',
      time: '5 minutes ago',
      unread: true
    },
    {
      id: '3',
      type: 'info',
      title: 'Repair Update',
      message: 'iPhone 13 repair is ready for pickup',
      time: '1 hour ago',
      unread: false
    }
  ];

  return (
    <div className="w-80 max-h-96 overflow-y-auto">
      <div className="p-4 border-b">
        <h3 className="font-semibold">Notifications</h3>
      </div>
      
      <div className="divide-y">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={cn(
              'p-4 hover:bg-muted/50 cursor-pointer transition-colors',
              notification.unread && 'bg-muted/30'
            )}
          >
            <div className="flex items-start gap-3">
              <div className={cn(
                'w-2 h-2 rounded-full mt-2',
                notification.type === 'warning' && 'bg-yellow-500',
                notification.type === 'success' && 'bg-green-500',
                notification.type === 'info' && 'bg-blue-500'
              )} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{notification.title}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {notification.message}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {notification.time}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="p-4 border-t">
        <Button variant="ghost" className="w-full text-sm">
          View All Notifications
        </Button>
      </div>
    </div>
  );
}
```

---

## 6. Implementation Timeline & Phases

### Phase 1: Foundation (Weeks 1-4)
- Set up Laravel backend with MySQL database
- Implement authentication system with Laravel Sanctum
- Create database migrations and models
- Set up basic API endpoints for core entities
- Integrate Next.js frontend with Laravel API
- Implement basic CRUD operations

### Phase 2: Core POS Functionality (Weeks 5-8)
- Complete POS transaction processing
- Implement inventory management with real-time updates
- Add customer management features
- Set up Laravel WebSockets for real-time updates
- Implement barcode scanning functionality
- Add basic reporting features

### Phase 3: Advanced Features (Weeks 9-12)
- Implement repair management system
- Add purchase order functionality
- Set up comprehensive search and filtering
- Implement role-based access control
- Add notification system
- Integrate payment processors

### Phase 4: Enhancement & Optimization (Weeks 13-16)
- Performance optimization and caching
- Advanced reporting and analytics
- Mobile responsiveness improvements
- Accessibility compliance
- Security hardening
- Comprehensive testing

### Phase 5: Deployment & Production (Weeks 17-20)
- Set up production infrastructure
- Implement CI/CD pipeline
- Performance monitoring and logging
- Backup and disaster recovery
- User training and documentation
- Go-live and support

---

## 7. Technology Stack Summary

### Backend (Laravel)
- **Framework**: Laravel 11
- **PHP Version**: 8.2+
- **Database**: MySQL 8.0+
- **Authentication**: Laravel Sanctum
- **Real-time**: Laravel WebSockets
- **Queue**: Redis
- **Cache**: Redis
- **File Storage**: AWS S3 / Local

### Frontend (Next.js)
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **UI Components**: shadcn/ui
- **State Management**: Zustand + React Query
- **Real-time**: Pusher JS
- **Forms**: React Hook Form + Zod

### Infrastructure
- **Web Server**: Nginx
- **Application Server**: PHP-FPM
- **Database**: MySQL 8.0+
- **Cache**: Redis
- **Queue Worker**: Laravel Queue
- **WebSocket Server**: Laravel WebSockets
- **File Storage**: AWS S3
- **CDN**: CloudFlare

### Development Tools
- **Version Control**: Git
- **Package Manager**: Composer (PHP), npm (Node.js)
- **Testing**: PHPUnit (Backend), Jest/Playwright (Frontend)
- **Code Quality**: PHP CS Fixer, ESLint, Prettier
- **API Documentation**: Laravel API Documentation Generator

This comprehensive roadmap provides a solid foundation for building a production-ready POS system using Laravel and MySQL, with a modern Next.js frontend. The architecture is designed to be scalable, maintainable, and secure while providing excellent user experience across all devices.