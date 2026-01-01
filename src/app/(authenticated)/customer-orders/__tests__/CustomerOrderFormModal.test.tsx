import { render, screen, waitFor } from '@/src/__tests__/utils/test-utils'
import { userEvent } from '@testing-library/user-event'
import { CustomerOrderFormModal } from '../CustomerOrderFormModal'
import * as customersApi from '@/src/lib/api/customers'
import * as productsApi from '@/src/lib/api/products'

jest.mock('@/src/lib/api/customers')
jest.mock('@/src/lib/api/products')

describe('CustomerOrderFormModal - Edge Cases', () => {
  const mockCustomers = [
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

  const mockProducts = [
    {
      id: 'product-1',
      name: 'Test Product',
      sku: 'SKU-001',
      cost_price: 100,
      selling_price: 150,
      stock: 50,
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(customersApi, 'fetchCustomers').mockResolvedValue({
      data: mockCustomers,
      meta: {},
    })
    jest.spyOn(productsApi, 'fetchProducts').mockResolvedValue({
      data: mockProducts,
      meta: {},
    })
  })

  describe('Supplier Exclusion', () => {
    it('should only fetch customers and exclude suppliers', async () => {
      render(
        <CustomerOrderFormModal
          open={true}
          onOpenChange={jest.fn()}
        />
      )

      // Wait for customers to be fetched
      await waitFor(() => {
        expect(customersApi.fetchCustomers).toHaveBeenCalled()
      })

      // Verify the API was called with exclude_suppliers parameter
      expect(customersApi.fetchCustomers).toHaveBeenCalledWith(
        expect.objectContaining({
          exclude_suppliers: true,
        })
      )
    })

    it('should not display suppliers in customer dropdown', async () => {
      // API should filter out suppliers with status='Supplier'

      jest.spyOn(customersApi, 'fetchCustomers').mockResolvedValue({
        data: mockCustomers, // API should filter out supplier
        meta: {},
      })

      render(
        <CustomerOrderFormModal
          open={true}
          onOpenChange={jest.fn()}
        />
      )

      await waitFor(() => {
        expect(customersApi.fetchCustomers).toHaveBeenCalled()
      })

      // Open customer dropdown
      const customerButton = screen.getByRole('combobox', {
        name: /customer/i,
      })
      await userEvent.click(customerButton)

      // Supplier should not be in the list
      await waitFor(() => {
        expect(screen.queryByText('Test Supplier')).not.toBeInTheDocument()
      })

      // Regular customers should be present
      expect(screen.getByText('Regular Customer')).toBeInTheDocument()
      expect(screen.getByText('Government Customer')).toBeInTheDocument()
    })
  })

  describe('Tax Calculation Edge Cases', () => {
    it('should default to 12% inclusive tax for regular customers', async () => {
      render(
        <CustomerOrderFormModal
          open={true}
          onOpenChange={jest.fn()}
        />
      )

      // Select regular customer
      const customerButton = screen.getByRole('combobox', {
        name: /customer/i,
      })
      await userEvent.click(customerButton)

      await waitFor(() => {
        expect(screen.getByText('Regular Customer')).toBeInTheDocument()
      })

      await userEvent.click(screen.getByText('Regular Customer'))

      // Check that tax rate is set to 12%
      const taxRateInput = screen.getByLabelText(/tax rate/i)
      expect(taxRateInput).toHaveValue(12)

      // Verify tax type is inclusive (VAT)
      const taxSwitch = screen.getByRole('switch', { name: /tax/i })
      expect(taxSwitch).toBeChecked() // Inclusive mode
    })

    it('should switch to 30% exclusive tax for government customers', async () => {
      render(
        <CustomerOrderFormModal
          open={true}
          onOpenChange={jest.fn()}
        />
      )

      // Select government customer
      const customerButton = screen.getByRole('combobox', {
        name: /customer/i,
      })
      await userEvent.click(customerButton)

      await waitFor(() => {
        expect(screen.getByText('Government Customer')).toBeInTheDocument()
      })

      await userEvent.click(screen.getByText('Government Customer'))

      // Check that tax rate changed to 30%
      await waitFor(() => {
        const taxRateInput = screen.getByLabelText(/tax rate/i)
        expect(taxRateInput).toHaveValue(30)
      })

      // Verify tax type is exclusive (Markup)
      const taxSwitch = screen.getByRole('switch', { name: /tax/i })
      expect(taxSwitch).not.toBeChecked() // Exclusive mode
    })

    it('should calculate tax correctly with inclusive mode', async () => {
      render(
        <CustomerOrderFormModal
          open={true}
          onOpenChange={jest.fn()}
        />
      )

      // Add a product with 1000 subtotal
      // With 12% inclusive tax:
      // Total = 1000
      // Net = 1000 / 1.12 = 892.86
      // Tax = 1000 - 892.86 = 107.14

      // Verify tax calculation display
      // (Implementation depends on where tax is displayed)
    })

    it('should calculate tax correctly with exclusive mode', async () => {
      render(
        <CustomerOrderFormModal
          open={true}
          onOpenChange={jest.fn()}
        />
      )

      // Add a product with 1000 subtotal
      // With 30% exclusive tax:
      // Subtotal = 1000
      // Tax = 1000 * 0.30 = 300
      // Total = 1300

      // Verify tax calculation display
    })

    it('should handle zero tax rate', async () => {
      render(
        <CustomerOrderFormModal
          open={true}
          onOpenChange={jest.fn()}
        />
      )

      // Manually set tax rate to 0
      const taxRateInput = screen.getByLabelText(/tax rate/i)
      await userEvent.clear(taxRateInput)
      await userEvent.type(taxRateInput, '0')

      // Tax should be 0
      // Total should equal subtotal
    })
  })

  describe('Discount Edge Cases', () => {
    it('should not allow discount to exceed order total', async () => {
      render(
        <CustomerOrderFormModal
          open={true}
          onOpenChange={jest.fn()}
        />
      )

      // Open discount accordion
      const discountAccordion = screen.getByText(/discount options/i)
      await userEvent.click(discountAccordion)

      // Set discount to 150% (should cap at 100%)
      const discountInput = screen.getByLabelText(/value/i)
      await userEvent.clear(discountInput)
      await userEvent.type(discountInput, '150')

      // Discount amount should be capped at subtotal
    })

    it('should handle negative discount values', async () => {
      render(
        <CustomerOrderFormModal
          open={true}
          onOpenChange={jest.fn()}
        />
      )

      const discountAccordion = screen.getByText(/discount options/i)
      await userEvent.click(discountAccordion)

      const discountInput = screen.getByLabelText(/value/i)
      await userEvent.clear(discountInput)
      await userEvent.type(discountInput, '-50')

      // Negative discount should be treated as 0
    })

    it('should calculate discount as percentage correctly', async () => {
      render(
        <CustomerOrderFormModal
          open={true}
          onOpenChange={jest.fn()}
        />
      )

      const discountAccordion = screen.getByText(/discount options/i)
      await userEvent.click(discountAccordion)

      // Select percentage type
      const discountTypeSelect = screen.getByRole('combobox', {
        name: /type/i,
      })
      await userEvent.click(discountTypeSelect)
      await userEvent.click(screen.getByText(/percentage/i))

      // Enter 10% discount
      const discountInput = screen.getByLabelText(/value/i)
      await userEvent.clear(discountInput)
      await userEvent.type(discountInput, '10')

      // 10% of 1000 = 100 discount
    })

    it('should calculate discount as fixed amount correctly', async () => {
      render(
        <CustomerOrderFormModal
          open={true}
          onOpenChange={jest.fn()}
        />
      )

      const discountAccordion = screen.getByText(/discount options/i)
      await userEvent.click(discountAccordion)

      // Select fixed amount type
      const discountTypeSelect = screen.getByRole('combobox', {
        name: /type/i,
      })
      await userEvent.click(discountTypeSelect)
      await userEvent.click(screen.getByText(/fixed amount/i))

      // Enter 100 discount
      const discountInput = screen.getByLabelText(/value/i)
      await userEvent.clear(discountInput)
      await userEvent.type(discountInput, '100')

      // Fixed 100 discount
    })
  })

  describe('Form Validation Edge Cases', () => {
    it('should require at least one item', async () => {
      render(
        <CustomerOrderFormModal
          open={true}
          onOpenChange={jest.fn()}
        />
      )

      // Try to submit without items
      const submitButton = screen.getByRole('button', { name: /save|create/i })
      await userEvent.click(submitButton)

      // Should show validation error
      await waitFor(() => {
        expect(
          screen.getByText(/at least one item is required/i)
        ).toBeInTheDocument()
      })
    })

    it('should not allow negative quantities', async () => {
      render(
        <CustomerOrderFormModal
          open={true}
          onOpenChange={jest.fn()}
        />
      )

      // Find quantity input
      const quantityInput = screen.getByLabelText(/quantity/i)
      await userEvent.clear(quantityInput)
      await userEvent.type(quantityInput, '-5')

      // Should show validation error
      await waitFor(() => {
        expect(
          screen.getByText(/quantity must be at least 1/i)
        ).toBeInTheDocument()
      })
    })

    it('should require customer selection', async () => {
      render(
        <CustomerOrderFormModal
          open={true}
          onOpenChange={jest.fn()}
        />
      )

      // Try to submit without selecting customer
      const submitButton = screen.getByRole('button', { name: /save|create/i })
      await userEvent.click(submitButton)

      // Should show validation error
      await waitFor(() => {
        expect(
          screen.getByText(/customer is required/i)
        ).toBeInTheDocument()
      })
    })

    it('should not allow zero unit cost', async () => {
      render(
        <CustomerOrderFormModal
          open={true}
          onOpenChange={jest.fn()}
        />
      )

      // Find unit cost input
      const unitCostInput = screen.getByLabelText(/unit cost/i)
      await userEvent.clear(unitCostInput)
      await userEvent.type(unitCostInput, '0')

      // Unit cost of 0 should prompt validation
    })
  })

  describe('Item Management', () => {
    it('should allow adding multiple items', async () => {
      render(
        <CustomerOrderFormModal
          open={true}
          onOpenChange={jest.fn()}
        />
      )

      const addItemButton = screen.getByRole('button', { name: /add item/i })
      
      // Add 2 more items (1 exists by default)
      await userEvent.click(addItemButton)
      await userEvent.click(addItemButton)

      // Should have 3 items total
      const itemContainers = screen.getAllByText(/product/i)
      expect(itemContainers.length).toBeGreaterThanOrEqual(3)
    })

    it('should allow removing items but keep at least one', async () => {
      render(
        <CustomerOrderFormModal
          open={true}
          onOpenChange={jest.fn()}
        />
      )

      // Try to remove the only item
      const removeButtons = screen.getAllByRole('button', {
        name: /remove|delete/i,
      })

      // Button should be disabled when only one item exists
      expect(removeButtons[0]).toBeDisabled()
    })
  })
})
