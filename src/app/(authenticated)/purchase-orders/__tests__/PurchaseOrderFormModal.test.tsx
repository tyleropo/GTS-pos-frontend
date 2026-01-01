import { render, screen, waitFor } from '@/src/__tests__/utils/test-utils'
import userEvent from '@testing-library/user-event'
import { PurchaseOrderFormModal } from '../PurchaseOrderFormModal'
import * as productsApi from '@/src/lib/api/products'
import * as suppliersApi from '@/src/lib/api/suppliers'
import * as purchaseOrdersApi from '@/src/lib/api/purchase-orders'

// Mock API modules
jest.mock('@/src/lib/api/products')
jest.mock('@/src/lib/api/suppliers')
jest.mock('@/src/lib/api/purchase-orders')

const mockProductsApi = productsApi as jest.Mocked<typeof productsApi>
const mockSuppliersApi = suppliersApi as jest.Mocked<typeof suppliersApi>
const mockPurchaseOrdersApi = purchaseOrdersApi as jest.Mocked<typeof purchaseOrdersApi>

describe('PurchaseOrderFormModal', () => {
  const mockSuppliers = [
    {
      id: 'supplier-1',
      company_name: 'Test Supplier',
      contact_person: 'John Doe',
      email: 'supplier@test.com',
      phone: '123-456-7890',
    },
  ]

  const mockProducts = [
    {
      id: 'product-1',
      sku: 'SKU-001',
      name: 'Test Product 1',
      cost_price: 100,
      selling_price: 150,
      stock_quantity: 50,
      barcode: null,
      description: null,
      category_id: null,
      supplier_id: null,
      brand: null,
      model: null,
      markup_percentage: 50,
      tax_rate: 12,
      reorder_level: 10,
      max_stock_level: null,
      image_url: null,
      is_active: true,
    },
    {
      id: 'product-2',
      sku: 'SKU-002',
      name: 'Test Product 2',
      cost_price: 200,
      selling_price: 300,
      stock_quantity: 30,
      barcode: null,
      description: null,
      category_id: null,
      supplier_id: null,
      brand: null,
      model: null,
      markup_percentage: 50,
      tax_rate: 12,
      reorder_level: 5,
      max_stock_level: null,
      image_url: null,
      is_active: true,
    },
  ]

  const mockOnSuccess = jest.fn()
  const mockOnOpenChange = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockSuppliersApi.fetchSuppliers.mockResolvedValue({
      data: mockSuppliers,
      meta: { current_page: 1, last_page: 1, per_page: 50, total: 1 },
    })
    mockProductsApi.fetchProducts.mockResolvedValue({
      data: mockProducts,
      meta: { current_page: 1, last_page: 1, per_page: 50, total: 2 },
    })
  })

  describe('Tax Settings Removal', () => {
    it('should not display tax settings section', async () => {
      render(
        <PurchaseOrderFormModal
          open={true}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      )

      // Wait for modal to render
      await waitFor(() => {
        expect(screen.getByText('New Purchases')).toBeInTheDocument()
      })

      // Verify tax settings are NOT present
      expect(screen.queryByText(/Tax Settings/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/Tax Rate/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/Tax Inclusive/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/Tax Exclusive/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/VAT/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/Markup/i)).not.toBeInTheDocument()
    })

    it('should not display discount settings', async () => {
      render(
        <PurchaseOrderFormModal
          open={true}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('New Purchases')).toBeInTheDocument()
      })

      // Verify discount settings are NOT present
      expect(screen.queryByText(/Discount Options/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/Percentage/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/Fixed Amount/i)).not.toBeInTheDocument()
    })

    it('should show simple total without tax breakdown', async () => {
      render(
        <PurchaseOrderFormModal
          open={true}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('New Purchases')).toBeInTheDocument()
      })

      // Should show only total
      expect(screen.getByText('Total:')).toBeInTheDocument()
      // Should NOT show subtotal or tax breakdown
      expect(screen.queryByText('Subtotal:')).not.toBeInTheDocument()
      expect(screen.queryByText(/Tax \(/i)).not.toBeInTheDocument()
    })
  })

  describe('New Product Registration Feature', () => {
    it('should show "Add New Product" button for each item', async () => {
      render(
        <PurchaseOrderFormModal
          open={true}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('New Purchases')).toBeInTheDocument()
      })

      // Should have at least one "Add New Product" button
      const addNewButtons = screen.getAllByText(/Add New Product/i)
      expect(addNewButtons.length).toBeGreaterThan(0)
    })

    it('should toggle between existing product and new product mode', async () => {
      const user = userEvent.setup()

      render(
        <PurchaseOrderFormModal
          open={true}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('New Purchases')).toBeInTheDocument()
      })

      // Click "Add New Product" button
      const addNewButton = screen.getByRole('button', { name: /Add New Product/i })
      await user.click(addNewButton)

      // Should show "New Product" badge
      await waitFor(() => {
        expect(screen.getByText('New Product')).toBeInTheDocument()
      })

      // Should show "Use Existing" button now
      expect(screen.getByRole('button', { name: /Use Existing/i })).toBeInTheDocument()

      // Should show text input for product name
      expect(screen.getByPlaceholderText(/Enter new product name/i)).toBeInTheDocument()
    })

    it('should switch back to existing product selector when clicking "Use Existing"', async () => {
      const user = userEvent.setup()

      render(
        <PurchaseOrderFormModal
          open={true}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('New Purchases')).toBeInTheDocument()
      })

      // Toggle to new product mode
      const addNewButton = screen.getByRole('button', { name: /Add New Product/i })
      await user.click(addNewButton)

      await waitFor(() => {
        expect(screen.getByText('New Product')).toBeInTheDocument()
      })

      // Toggle back to existing product mode
      const useExistingButton = screen.getByRole('button', { name: /Use Existing/i })
      await user.click(useExistingButton)

      // Badge should disappear
      await waitFor(() => {
        expect(screen.queryByText('New Product')).not.toBeInTheDocument()
      })

      // Should show product selector again
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })

    it('should allow entering custom product name and cost for new products', async () => {
      const user = userEvent.setup()

      render(
        <PurchaseOrderFormModal
          open={true}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('New Purchases')).toBeInTheDocument()
      })

      // Toggle to new product mode
      const addNewButton = screen.getByRole('button', { name: /Add New Product/i })
      await user.click(addNewButton)

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Enter new product name/i)).toBeInTheDocument()
      })

      // Enter product name
      const nameInput = screen.getByPlaceholderText(/Enter new product name/i)
      await user.type(nameInput, 'Brand New Product')

      // Enter unit cost
      const costInputs = screen.getAllByLabelText(/Unit Cost/i)
      await user.clear(costInputs[0])
      await user.type(costInputs[0], '250')

      // Enter quantity
      const qtyInputs = screen.getAllByLabelText(/Quantity/i)
      await user.clear(qtyInputs[0])
      await user.type(qtyInputs[0], '10')

      // Verify values
      expect(nameInput).toHaveValue('Brand New Product')
      expect(costInputs[0]).toHaveValue(250)
      expect(qtyInputs[0]).toHaveValue(10)
    })
  })

  describe('Form Submission with New Products', () => {
    it('should submit purchase order with new product information', async () => {
      const user = userEvent.setup()

      mockPurchaseOrdersApi.createPurchaseOrder.mockResolvedValue({
        id: 'new-po',
        po_number: 'PO-001',
        supplier_id: 'supplier-1',
        status: 'draft',
        subtotal: 2500,
        tax: 0,
        total: 2500,
        created_at: '2024-01-01',
        items: [],
        supplier: mockSuppliers[0],
      } as any)

      render(
        <PurchaseOrderFormModal
          open={true}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('New Purchases')).toBeInTheDocument()
      })

      // Select supplier
      const supplierButton = screen.getByRole('combobox', { name: /select supplier/i })
      await user.click(supplierButton)

      await waitFor(() => {
        expect(screen.getByText('Test Supplier')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Test Supplier'))

      // Toggle to new product
      const addNewButton = screen.getByRole('button', { name: /Add New Product/i })
      await user.click(addNewButton)

      // Fill in new product details
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Enter new product name/i)).toBeInTheDocument()
      })

      const nameInput = screen.getByPlaceholderText(/Enter new product name/i)
      await user.type(nameInput, 'New Laptop Model')

      const costInputs = screen.getAllByLabelText(/Unit Cost/i)
      await user.clear(costInputs[0])
      await user.type(costInputs[0], '500')

      const qtyInputs = screen.getAllByLabelText(/Quantity/i)
      await user.clear(qtyInputs[0])
      await user.type(qtyInputs[0], '5')

      // Submit form
      const submitButton = screen.getByRole('button', { name: /Create Order/i })
      await user.click(submitButton)

      // Verify API was called with new product data
      await waitFor(() => {
        expect(mockPurchaseOrdersApi.createPurchaseOrder).toHaveBeenCalled()
      })

      const callArgs = mockPurchaseOrdersApi.createPurchaseOrder.mock.calls[0][0]
      expect(callArgs.items[0].product_id).toContain('new_')
      expect(callArgs.meta.new_products).toHaveLength(1)
      expect(callArgs.meta.new_products[0].name).toBe('New Laptop Model')
      expect(callArgs.meta.new_products[0].cost).toBe(500)
    })
  })

  describe('Form Submission with Existing Products', () => {
    it('should submit purchase order with existing product', async () => {
      const user = userEvent.setup()

      mockPurchaseOrdersApi.createPurchaseOrder.mockResolvedValue({
        id: 'new-po',
        po_number: 'PO-002',
        supplier_id: 'supplier-1',
        status: 'draft',
        subtotal: 1000,
        tax: 0,
        total: 1000,
        created_at: '2024-01-01',
        items: [],
        supplier: mockSuppliers[0],
      } as any)

      render(
        <PurchaseOrderFormModal
          open={true}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('New Purchases')).toBeInTheDocument()
      })

      // Select supplier
      const supplierButton = screen.getByRole('combobox', { name: /select supplier/i })
      await user.click(supplierButton)

      await waitFor(() => {
        expect(screen.getByText('Test Supplier')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Test Supplier'))

      // Select existing product (in existing mode by default)
      const productButtons = screen.getAllByRole('combobox')
      await user.click(productButtons[1]) // Second combobox is product selector

      // Type to search
      const searchInput = screen.getByPlaceholderText(/Search product/i)
      await user.type(searchInput, 'Test')

      await waitFor(() => {
        expect(screen.getByText(/Test Product 1/i)).toBeInTheDocument()
      })

      await user.click(screen.getByText(/Test Product 1/i))

      // Submit form
      const submitButton = screen.getByRole('button', { name: /Create Order/i })
      await user.click(submitButton)

      // Verify API was called
      await waitFor(() => {
        expect(mockPurchaseOrdersApi.createPurchaseOrder).toHaveBeenCalled()
      })

      const callArgs = mockPurchaseOrdersApi.createPurchaseOrder.mock.calls[0][0]
      expect(callArgs.items[0].product_id).toBe('product-1')
    })
  })

  describe('Mixed Product Types', () => {
    it('should handle purchase order with both existing and new products', async () => {
      const user = userEvent.setup()

      mockPurchaseOrdersApi.createPurchaseOrder.mockResolvedValue({
        id: 'new-po',
        po_number: 'PO-003',
        supplier_id: 'supplier-1',
        status: 'draft',
        subtotal: 3500,
        tax: 0,
        total: 3500,
        created_at: '2024-01-01',
        items: [],
        supplier: mockSuppliers[0],
      } as any)

      render(
        <PurchaseOrderFormModal
          open={true}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('New Purchases')).toBeInTheDocument()
      })

      // Select supplier first
      const supplierButton = screen.getByRole('combobox', { name: /select supplier/i })
      await user.click(supplierButton)

      await waitFor(() => {
        expect(screen.getByText('Test Supplier')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Test Supplier'))

      // Add another item
      const addItemButton = screen.getByRole('button', { name: /Add Item/i })
      await user.click(addItemButton)

      // First item: Use existing product
      const productButtons = screen.getAllByRole('combobox')
      await user.click(productButtons[1]) // Product selector for first item

      const searchInput = screen.getByPlaceholderText(/Search product/i)
      await user.type(searchInput, 'Test')

      await waitFor(() => {
        expect(screen.getByText(/Test Product 1/i)).toBeInTheDocument()
      })

      await user.click(screen.getByText(/Test Product 1/i))

      // Second item: Use new product
      const addNewButtons = screen.getAllByRole('button', { name: /Add New Product/i })
      await user.click(addNewButtons[1]) // Second item's toggle button

      await waitFor(() => {
        const nameInputs = screen.getAllByPlaceholderText(/Enter new product name/i)
        expect(nameInputs).toHaveLength(1)
      })

      const newProductName = screen.getByPlaceholderText(/Enter new product name/i)
      await user.type(newProductName, 'Custom Widget')

      // Submit
      const submitButton = screen.getByRole('button', { name: /Create Order/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockPurchaseOrdersApi.createPurchaseOrder).toHaveBeenCalled()
      })

      const callArgs = mockPurchaseOrdersApi.createPurchaseOrder.mock.calls[0][0]
      expect(callArgs.items).toHaveLength(2)
      expect(callArgs.items[0].product_id).toBe('product-1') // Existing
      expect(callArgs.items[1].product_id).toContain('new_') // New product
    })
  })

  describe('Total Calculation', () => {
    it('should correctly calculate total without tax', async () => {
      const user  = userEvent.setup()

      render(
        <PurchaseOrderFormModal
          open={true}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('New Purchases')).toBeInTheDocument()
      })

      // Toggle to new product mode for easier testing
      const addNewButton = screen.getByRole('button', { name: /Add New Product/i })
      await user.click(addNewButton)

      // Enter values
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Enter new product name/i)).toBeInTheDocument()
      })

      const nameInput = screen.getByPlaceholderText(/Enter new product name/i)
      await user.type(nameInput, 'Test Item')

      const costInputs = screen.getAllByLabelText(/Unit Cost/i)
      await user.clear(costInputs[0])
      await user.type(costInputs[0], '100')

      const qtyInputs = screen.getAllByLabelText(/Quantity/i)
      await user.clear(qtyInputs[0])
      await user.type(qtyInputs[0], '5')

      // Total should be 500 (100 * 5)
      await waitFor(() => {
        expect(screen.getByText('₱500.00')).toBeInTheDocument()
      })
    })
  })
})
