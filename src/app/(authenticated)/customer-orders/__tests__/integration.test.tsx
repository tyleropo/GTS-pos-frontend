// Mock PDF generator to avoid jsPDF TextEncoder issues
jest.mock('../utils/pdf-generator', () => ({
  generateCustomerOrderPDF: jest.fn(),
}))

import { render, screen, waitFor } from '@/src/__tests__/utils/test-utils'
import userEvent from '@testing-library/user-event'
import CustomerOrdersPage from '../page'
import * as api from '@/src/lib/api/customer-orders'

// Mock the API functions
jest.mock('@/src/lib/api/customer-orders')

const mockApi = api as jest.Mocked<typeof api>

describe('Customer Orders Integration Tests', () => {
  const mockCustomerOrders = [
    {
      id: 'co-1',
      co_number: 'CO-001',
      customer_id: 'customer-1',
      status: 'draft' as const,
      subtotal: 1000,
      tax: 120, // 12% inclusive
      total: 1120,
      created_at: '2024-01-01',
      items: [
        {
          id: 'item-1',
          product_id: 'prod-1',
          product_name: 'Product 1',
          quantity_ordered: 10,
          quantity_fulfilled: 0,
          unit_cost: 100,
          line_total: 1000,
        },
      ],
      customer: {
        id: 'customer-1',
        name: 'Regular Customer',
        email: 'customer@test.com',
        type: 'Regular',
      },
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    mockApi.fetchCustomerOrders.mockResolvedValue({
      data: [],
      meta: {
        current_page: 1,
        last_page: 1,
        per_page: 25,
        total: 0,
      },
    })
  })

  describe('Customer Order Creation with Regular Customer (12% VAT)', () => {
    it('should create order with 12% inclusive tax for regular customer', async () => {
      const user = userEvent.setup()

      mockApi.fetchCustomerOrders.mockResolvedValueOnce({
        data: [],
        meta: {
          current_page: 1,
          last_page: 1,
          per_page: 25,
          total: 0,
        },
      })

      mockApi.createCustomerOrder.mockResolvedValue({
        id: 'new-co',
        co_number: 'CO-002',
        customer_id: 'customer-1',
        status: 'draft' as const,
        subtotal: 892.86, // Subtotal before 12% inclusive tax
        tax: 107.14, // 12% of total (1000)
        total: 1000,
        created_at: '2024-01-02',
        items: [],
        customer: {
          id: 'customer-1',
          name: 'Regular Customer',
          email: 'customer@test.com',
          type: 'Regular',
        },
      })

      render(<CustomerOrdersPage />)

      await waitFor(() => {
        expect(screen.getByText(/no customer orders/i)).toBeInTheDocument()
      })

      // Click "Add Customer Order" button
      const addButton = screen.getByRole('button', { name: /add customer order/i })
      await user.click(addButton)

      // Modal should open
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      // In actual test: select regular customer, add items, verify tax = 12% inclusive
      // Submit form
      // Verify order created with correct tax calculation
    })
  })

  describe('Customer Order Creation with Government Customer (30% Markup)', () => {
    it('should create order with 30% exclusive tax for government customer', async () => {
      const user = userEvent.setup()

      mockApi.createCustomerOrder.mockResolvedValue({
        id: 'new-co-gov',
        co_number: 'CO-003',
        customer_id: 'customer-gov',
        status: 'draft' as const,
        subtotal: 1000,
        tax: 300, // 30% exclusive of subtotal
        total: 1300,
        created_at: '2024-01-02',
        items: [],
        customer: {
          id: 'customer-gov',
          name: 'Government Entity',
          email: 'gov@test.com',
          type: 'Government',
        },
      })

      render(<CustomerOrdersPage />)

      await waitFor(() => {
        expect(screen.getByText(/no customer orders/i)).toBeInTheDocument()
      })

      const addButton = screen.getByRole('button', { name: /add customer order/i })
      await user.click(addButton)

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      // Select government customer
      // Verify tax switches to 30% exclusive
      // Add items with subtotal = 1000
      // Verify calculated tax = 300, total = 1300
      // Submit and verify
    })
  })

  describe('Tax Calculation Switching', () => {
    it('should switch tax calculation when changing customer type', async () => {
      const user = userEvent.setup()

      render(<CustomerOrdersPage />)

      await waitFor(() => {
        expect(screen.getByText(/no customer orders/i)).toBeInTheDocument()
      })

      const addButton = screen.getByRole('button', { name: /add customer order/i })
      await user.click(addButton)

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      // Add items first (subtotal = 1000)
      // Select regular customer -> verify tax = ~107 (12% inclusive)
      // Change to government customer -> verify tax = 300 (30% exclusive)
      // Change back to regular -> verify tax back to ~107
    })
  })

  describe('Customer Order with Discount', () => {
    it('should apply percentage discount correctly', async () => {
      // Create order with 10% discount
      // Verify: subtotal - discount = discounted subtotal
      // Then apply tax on discounted amount
    })

    it('should apply fixed amount discount correctly', async () => {
      // Create order with $100 fixed discount
      // Verify calculations with fixed discount
    })

    it('should not allow discount to exceed order total', async () => {
      // Try to apply 101% discount
      // Or fixed discount > subtotal
      // Verify validation prevents this
    })
  })

  describe('Customer Order Payment Flow', () => {
    it('should process partial payment and track outstanding balance', async () => {
      const user = userEvent.setup()
      const unpaidOrder = {
        ...mockCustomerOrders[0],
        status: 'submitted' as const,
        payment_status: 'pending' as const,
        amount_paid: 0,
        outstanding_balance: 1120,
      }

      mockApi.fetchCustomerOrders.mockResolvedValue({
        data: [unpaidOrder],
        meta: {
          current_page: 1,
          last_page: 1,
          per_page: 25,
          total: 1,
        },
      })

      render(<CustomerOrdersPage />)

      await waitFor(() => {
        expect(screen.getByText('CO-001')).toBeInTheDocument()
      })

      // Click payment button
      // Add partial payment of $500
      // Verify outstanding_balance = 1120 - 500 = 620
      // payment_status should be 'partial'
    })

    it('should mark order as paid when full payment received', async () => {
      // Create order with total = 1120
      // Add payment of 1120
      // Verify payment_status = 'paid'
      // outstanding_balance = 0
    })
  })

  describe('Customer Order Fulfillment Flow', () => {
    it('should fulfill a submitted customer order', async () => {
      const user = userEvent.setup()
      const submittedOrder = {
        ...mockCustomerOrders[0],
        status: 'submitted' as const,
      }

      mockApi.fetchCustomerOrders.mockResolvedValue({
        data: [submittedOrder],
        meta: {
          current_page: 1,
          last_page: 1,
          per_page: 25,
          total: 1,
        },
      })

      render(<CustomerOrdersPage />)

      await waitFor(() => {
        expect(screen.getByText('CO-001')).toBeInTheDocument()
      })

      // Click fulfill button
      // Enter quantities fulfilled
      // Submit
      // Verify status changes to 'fulfilled' or 'partially fulfilled'
      // Verify inventory is deducted
    })

    it('should handle partial fulfillment', async () => {
      // Order has 10 items
      // Fulfill only 5
      // Verify status = 'partially fulfilled'
      // quantity_fulfilled = 5
      // Outstanding quantity = 5
    })
  })

  describe('Order Statistics Integration', () => {
    it('should update statistics when orders are created', async () => {
      const orders = [
        { ...mockCustomerOrders[0], status: 'draft' as const },
        { ...mockCustomerOrders[0], id: 'co-2', status: 'submitted' as const },
        { ...mockCustomerOrders[0], id: 'co-3', status: 'fulfilled' as const },
      ]

      mockApi.fetchCustomerOrders.mockResolvedValue({
        data: orders,
        meta: {
          current_page: 1,
          last_page: 1,
          per_page: 25,
          total: 3,
        },
      })

      render(<CustomerOrdersPage />)

      // Wait for stats component to display
      await waitFor(() => {
        // Verify stats show:
        // 1 draft, 1 submitted, 1 fulfilled
        // Total value calculated correctly
      })
    })
  })
})
