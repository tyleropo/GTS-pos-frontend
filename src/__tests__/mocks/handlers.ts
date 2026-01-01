import { http, HttpResponse } from 'msw'

// Mock data for purchase orders
export const mockPurchaseOrders = [
  {
    id: '1',
    po_number: 'PO-20250101-0001',
    supplier_id: 'supplier-1',
    status: 'draft',
    subtotal: 1000,
    tax: 120,
    total: 1120,
    created_at: '2025-01-01T00:00:00Z',
    items: [
      {
        id: '1',
        product_id: 'product-1',
        product_name: 'Product 1',
        quantity_ordered: 10,
        quantity_received: 0,
        unit_cost: 100,
        line_total: 1000,
      },
    ],
    supplier: {
      id: 'supplier-1',
      company: 'Test Supplier',
      name: 'Supplier Contact',
    },
  },
]

// Mock data for customer orders
export const mockCustomerOrders = [
  {
    id: '1',
    co_number: 'CO-20250101-0001',
    customer_id: 'customer-1',
    status: 'draft',
    subtotal: 1000,
    tax: 120,
    total: 1120,
    created_at: '2025-01-01T00:00:00Z',
    items: [
      {
        id: '1',
        product_id: 'product-1',
        product_name: 'Product 1',
        quantity_ordered: 10,
        quantity_fulfilled: 0,
        unit_cost: 100,
        line_total: 1000,
      },
    ],
    customer: {
      id: 'customer-1',
      name: 'Test Customer',
      email: 'customer@test.com',
      type: 'Regular',
    },
  },
]

// Mock data for customers (excluding suppliers)
export const mockCustomers = [
  {
    id: 'customer-1',
    name: 'Regular Customer',
    email: 'regular@test.com',
    type: 'Regular',
    status: 'Active',
  },
  {
    id: 'customer-2',
    name: 'Government Customer',
    email: 'gov@test.com',
    type: 'Government',
    status: 'Active',
  },
]

// Mock data for products
export const mockProducts = [
  {
    id: 'product-1',
    name: 'Test Product 1',
    sku: 'SKU-001',
    cost_price: 100,
    selling_price: 150,
    stock: 50,
  },
  {
    id: 'product-2',
    name: 'Test Product 2',
    sku: 'SKU-002',
    cost_price: 200,
    selling_price: 300,
    stock: 30,
  },
]

// MSW Request Handlers
export const handlers = [
  // Purchase Orders
  http.get('*/api/purchase-orders', () => {
    return HttpResponse.json({ data: mockPurchaseOrders })
  }),

  http.get('*/api/purchase-orders/:id', ({ params }) => {
    const order = mockPurchaseOrders.find((o) => o.id === params.id)
    return order
      ? HttpResponse.json(order)
      : HttpResponse.json({ error: 'Not found' }, { status: 404 })
  }),

  http.post('*/api/purchase-orders', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({ ...body, id: 'new-po-id' }, { status: 201 })
  }),

  http.put('*/api/purchase-orders/:id', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({ ...body })
  }),

  // Customer Orders
  http.get('*/api/customer-orders', () => {
    return HttpResponse.json({ data: mockCustomerOrders })
  }),

  http.get('*/api/customer-orders/:id', ({ params }) => {
    const order = mockCustomerOrders.find((o) => o.id === params.id)
    return order
      ? HttpResponse.json(order)
      : HttpResponse.json({ error: 'Not found' }, { status: 404 })
  }),

  http.post('*/api/customer-orders', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({ ...body, id: 'new-co-id' }, { status: 201 })
  }),

  http.put('*/api/customer-orders/:id', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({ ...body })
  }),

  // Customers
  http.get('*/api/customers', ({ request }) => {
    const url = new URL(request.url)
    const excludeSuppliers = url.searchParams.get('exclude_suppliers')
    
    let customers = mockCustomers
    if (excludeSuppliers === 'true') {
      customers = customers.filter((c) => c.status !== 'Supplier')
    }
    
    return HttpResponse.json({ data: customers })
  }),

  // Products
  http.get('*/api/products', () => {
    return HttpResponse.json({ data: mockProducts })
  }),
]
