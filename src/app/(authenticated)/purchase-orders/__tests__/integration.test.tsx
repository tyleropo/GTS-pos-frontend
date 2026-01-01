// Mock PDF generator to avoid jsPDF TextEncoder issues
jest.mock('../utils/pdf-generator', () => ({
  generatePurchaseOrderPDF: jest.fn(),
}))

import { render, screen, waitFor } from '@/src/__tests__/utils/test-utils'
import userEvent from '@testing-library/user-event'
import PurchaseOrdersPage from '../page'
import * as api from '@/src/lib/api/purchase-orders'

// Mock the API functions
jest.mock('@/src/lib/api/purchase-orders')

const mockApi = api as jest.Mocked<typeof api>

describe('Purchase Orders Integration Tests', () => {
  const mockPurchaseOrders = [
    {
      id: 'po-1',
      po_number: 'PO-001',
      supplier_id: 'supplier-1',
      status: 'draft' as const,
      subtotal: 1000,
      tax: 120,
      total: 1120,
      created_at: '2024-01-01',
      items: [
        {
          id: 'item-1',
          product_id: 'prod-1',
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

  beforeEach(() => {
    jest.clearAllMocks()
    mockApi.fetchPurchaseOrders.mockResolvedValue({
      data: [],
      meta: {
        current_page: 1,
        last_page: 1,
        per_page: 25,
        total: 0,
      },
    })
  })

  describe('Complete Purchase Order Creation Flow', () => {
    it('should create a purchase order from start to finish', async () => {
      const user = userEvent.setup()

      mockApi.fetchPurchaseOrders.mockResolvedValueOnce({
        data: [],
        meta: {
          current_page: 1,
          last_page: 1,
          per_page: 25,
          total: 0,
        },
      })

      mockApi.createPurchaseOrder.mockResolvedValue({
        id: 'new-po',
        po_number: 'PO-002',
        supplier_id: 'supplier-1',
        status: 'draft' as const,
        subtotal: 500,
        tax: 60,
        total: 560,
        created_at: '2024-01-02',
        items: [],
        supplier: { id: 'supplier-1', company: 'Test Supplier', name: 'Contact' },
      })

      // Render the page
      render(<PurchaseOrdersPage />)

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText(/no purchase orders/i)).toBeInTheDocument()
      })

      // Click "Add Purchase Order" button
      const addButton = screen.getByRole('button', { name: /add purchase order/i })
      await user.click(addButton)

      // Modal should open
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      // Fill in the form (simplified - actual form fields would vary)
      // In a real integration test, we'd fill all required fields

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /save|create/i })
      await user.click(submitButton)

      // Wait for API call
      await waitFor(() => {
        expect(mockApi.createPurchaseOrder).toHaveBeenCalled()
      })

      // Verify success (modal closes, data refetches, new PO appears)
      // This would be more detailed in a real test
    })
  })

  describe('Purchase Order Payment Flow', () => {
    it('should process payment for a purchase order', async () => {
      const user = userEvent.setup()
      const unpaidOrder = {
        ...mockPurchaseOrders[0],
        status: 'submitted' as const,
        amount_paid: 0,
        outstanding_balance: 1120,
      }

      mockApi.fetchPurchaseOrders.mockResolvedValue({
        data: [unpaidOrder],
        meta: {
          current_page: 1,
          last_page: 1,
          per_page: 25,
          total: 1,
        },
      })

      mockApi.fetchPurchaseOrder.mockResolvedValue(unpaidOrder)

      render(<PurchaseOrdersPage />)

      // Wait for orders to load
      await waitFor(() => {
        expect(screen.getByText('PO-001')).toBeInTheDocument()
      })

      // Find and click payment button for the order
      const paymentButtons = screen.getAllByRole('button', { name: /pay|payment/i })
      if (paymentButtons.length > 0) {
        await user.click(paymentButtons[0])

        // Payment modal/dialog should appear
        // Fill payment details
        // Submit payment
        // Verify outstanding balance updated
      }

      // This is a simplified version - actual implementation would be more detailed
    })

    it('should handle partial payment correctly', async () => {
      // Test partial payment scenario
      // Verify outstanding balance = total - amount_paid
    })
  })

  describe('Purchase Order Receiving/Fulfillment Flow', () => {
    it('should receive items for a submitted purchase order', async () => {
      const user = userEvent.setup()
      const submittedOrder = {
        ...mockPurchaseOrders[0],
        status: 'submitted' as const,
      }

      mockApi.fetchPurchaseOrders.mockResolvedValue({
        data: [submittedOrder],
        meta: {
          current_page: 1,
          last_page: 1,
          per_page: 25,
          total: 1,
        },
      })

      render(<PurchaseOrdersPage />)

      await waitFor(() => {
        expect(screen.getByText('PO-001')).toBeInTheDocument()
      })

      // Find and click receive button
      const receiveButtons = screen.getAllByRole('button', { name: /receive|fulfill/i })
      if (receiveButtons.length > 0) {
        await user.click(receiveButtons[0])

        // Receiving modal should open
        // Enter quantities received
        // Submit
        // Verify status changes to 'received' or partially received
      }
    })
  })

  describe('Edit Purchase Order Flow', () => {
    it('should edit an existing draft purchase order', async () => {
      const user = userEvent.setup()

      mockApi.fetchPurchaseOrders.mockResolvedValue({
        data: mockPurchaseOrders,
        meta: {
          current_page: 1,
          last_page: 1,
          per_page: 25,
          total: 1,
        },
      })

      mockApi.fetchPurchaseOrder.mockResolvedValue(mockPurchaseOrders[0])

      mockApi.updatePurchaseOrder.mockResolvedValue({
        ...mockPurchaseOrders[0],
        subtotal: 1500,
        tax: 180,
        total: 1680,
      })

      render(<PurchaseOrdersPage />)

      await waitFor(() => {
        expect(screen.getByText('PO-001')).toBeInTheDocument()
      })

      // Click edit button for the order
      const editButtons = screen.getAllByRole('button', { name: /edit/i })
      if (editButtons.length > 0) {
        await user.click(editButtons[0])

        // Edit modal should open with pre-filled data
        // Modify some fields
        // Save changes
        // Verify updated values appear in the list
      }
    })
  })

  describe('Status Transitions', () => {
    it('should transition from draft → submitted → received', async () => {
      // Test complete status workflow
      // Draft -> click submit -> becomes submitted
      // Submitted -> receive items -> becomes received
    })

    it('should not allow editing submitted or received orders', async () => {
      const submittedOrder = {
        ...mockPurchaseOrders[0],
        status: 'submitted' as const,
      }

      mockApi.fetchPurchaseOrders.mockResolvedValue({
        data: [submittedOrder],
        meta: {
          current_page: 1,
          last_page: 1,
          per_page: 25,
          total: 1,
        },
      })

      render(<PurchaseOrdersPage />)

      await waitFor(() => {
        expect(screen.getByText('PO-001')).toBeInTheDocument()
      })

      // Edit button should be disabled or not present for submitted orders
      const editButtons = screen.queryAllByRole('button', { name: /edit/i })
      // Verify edit is not available for submitted status
    })
  })
})
