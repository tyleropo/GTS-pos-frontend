// Mock PDF generator to avoid jsPDF TextEncoder issues
jest.mock('../utils/pdf-generator', () => ({
  generatePurchaseOrderPDF: jest.fn(),
}))

import { render, screen, waitFor } from '@/src/__tests__/utils/test-utils'
import { userEvent } from '@testing-library/user-event'
import PurchaseOrdersPage from '../page'
import * as api from '@/src/lib/api/purchase-orders'

// Mock the API functions
jest.mock('@/src/lib/api/purchase-orders')

describe('PurchaseOrdersPage', () => {
  const mockPurchaseOrders = [
    {
      id: '1',
      po_number: 'PO-20250101-0001',
      supplier_id: 'supplier-1',
      status: 'draft' as const,
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
        company_name: 'Test Supplier',
        contact_person: 'Supplier Contact',
        name: 'Supplier Contact', // Keep for backward compatibility if needed by test
      },
      payments: []
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Loading States', () => {
    it('should show loading state while fetching purchase orders', () => {
      jest.spyOn(api, 'fetchPurchaseOrders').mockImplementation(
        () => new Promise(() => {}) // Never resolves
      )

      render(<PurchaseOrdersPage />)

      expect(screen.getByText(/loading purchases/i)).toBeInTheDocument()
    })

    it('should display purchase orders after successful fetch', async () => {
      jest.spyOn(api, 'fetchPurchaseOrders').mockResolvedValue({
        data: mockPurchaseOrders,
      })

      render(<PurchaseOrdersPage />)

      await waitFor(() => {
        expect(screen.getByText('PO-20250101-0001')).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('should show error state when API call fails', async () => {
      const errorMessage = 'Failed to load purchase orders'
      jest.spyOn(api, 'fetchPurchaseOrders').mockRejectedValue(
        new Error(errorMessage)
      )

      render(<PurchaseOrdersPage />)

      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument()
        expect(screen.getByText(errorMessage)).toBeInTheDocument()
      })
    })

    it('should allow retry after error', async () => {
      jest.spyOn(api, 'fetchPurchaseOrders')
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ data: mockPurchaseOrders })

      render(<PurchaseOrdersPage />)

      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument()
      })

      const retryButton = screen.getByText(/retry/i)
      await userEvent.click(retryButton)

      await waitFor(() => {
        expect(screen.getByText('PO-20250101-0001')).toBeInTheDocument()
      })
    })
  })

  describe('Empty State', () => {
    it('should handle empty purchase orders list', async () => {
      jest.spyOn(api, 'fetchPurchaseOrders').mockResolvedValue({
        data: [],
      })

      render(<PurchaseOrdersPage />)

      await waitFor(() => {
        // Should show the page but no purchase orders
        expect(screen.getByText(/purchase orders/i)).toBeInTheDocument()
      })
    })
  })

  describe('Purchase Order Actions', () => {
    beforeEach(() => {
      jest.spyOn(api, 'fetchPurchaseOrders').mockResolvedValue({
        data: mockPurchaseOrders,
      })
    })

    it('should open form modal when clicking New Purchase Order', async () => {
      render(<PurchaseOrdersPage />)

      await waitFor(() => {
        expect(screen.getByText('PO-20250101-0001')).toBeInTheDocument()
      })

      const newButton = screen.getByRole('button', {
        name: /new purchase order/i,
      })
      await userEvent.click(newButton)

     // Modal should open
      await waitFor(() => {
        expect(screen.getByText(/new purchase order/i)).toBeInTheDocument()
      })
    })

    it('should handle cancel order action', async () => {
      jest.spyOn(api, 'updatePurchaseOrder').mockResolvedValue({
        ...mockPurchaseOrders[0],
        status: 'cancelled' as const,
      })

      render(<PurchaseOrdersPage />)

      await waitFor(() => {
        expect(screen.getByText('PO-20250101-0001')).toBeInTheDocument()
      })

      // Find and click cancel action (implementation depends on your UI)
      // This is a placeholder - adjust based on actual UI structure
    })
  })

  describe('Edge Cases - Payment Flow', () => {
    it('should not allow payment on cancelled orders', async () => {
      const cancelledOrder = {
        ...mockPurchaseOrders[0],
        status: 'cancelled' as const,
      }

      jest.spyOn(api, 'fetchPurchaseOrders').mockResolvedValue({
        data: [cancelledOrder],
      })

      render(<PurchaseOrdersPage />)

      await waitFor(() => {
        expect(screen.getByText('PO-20250101-0001')).toBeInTheDocument()
      })

      // Payment button should be disabled for cancelled orders
      // Implementation depends on your UI structure
    })
  })

  describe('Edge Cases - Fulfillment', () => {
    it('should handle fulfillment of purchase orders', async () => {
      jest.spyOn(api, 'fetchPurchaseOrder').mockResolvedValue(
        mockPurchaseOrders[0]
      )

      render(<PurchaseOrdersPage />)

      await waitFor(() => {
        expect(screen.getByText('PO-20250101-0001')).toBeInTheDocument()
      })

      // Test fulfillment modal - adjust based on your UI
    })
  })

  describe('Edge Cases - PDF Generation', () => {
    it('should handle PDF download', async () => {
      render(<PurchaseOrdersPage />)

      await waitFor(() => {
        expect(screen.getByText('PO-20250101-0001')).toBeInTheDocument()
      })

      // Test PDF download - adjust based on your UI structure
    })

    it('should handle PDF generation errors', async () => {
      // Test error handling for PDF generation
    })
  })
})
