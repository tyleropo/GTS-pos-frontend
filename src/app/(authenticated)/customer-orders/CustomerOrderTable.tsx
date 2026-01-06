
import React, { useState } from 'react'
import { formatCurrency } from '@/src/lib/format-currency'
import { format, isWithinInterval, startOfDay, endOfDay } from 'date-fns'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem } from '@/src/components/ui/dropdown-menu'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/src/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { Search, Filter, AlertCircle, MoreHorizontal, Edit, Download, FileText, CheckCircle, XCircle, CreditCard, Clock, Printer, Trash2, PhilippinePesoIcon } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/src/components/ui/table'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Badge } from '@/src/components/ui/badge'
import { Checkbox } from '@/src/components/ui/checkbox'
import { CustomerOrder } from '@/src/types/customerOrder'
import Link from 'next/link'
import { DateRangePicker } from '@/src/components/date-range-picker'
import { DateRange } from 'react-day-picker'

interface CustomerOrderTableProps {
  customerOrders: CustomerOrder[];
  initialSearchQuery?: string;
  onEdit?: (order: CustomerOrder) => void;
  onDelete?: (order: CustomerOrder) => void;
  onFulfill?: (order: CustomerOrder) => void;
  onCancel?: (order: CustomerOrder) => void;
  onDownloadPDF?: (order: CustomerOrder) => void;
  onPrint?: (order: CustomerOrder) => void;
  onAddPayment?: (order: CustomerOrder) => void;
  onBulkPayment?: (orders: CustomerOrder[]) => void;
  dateRange?: DateRange;
  onDateRangeChange?: (range: DateRange | undefined) => void;
}

const CustomerOrderTable = ({
  customerOrders,
  initialSearchQuery = "",
  onEdit,
  onDelete,
  onFulfill,
  onCancel,
  onDownloadPDF,
  onPrint,
  onAddPayment,
  onBulkPayment,
  dateRange,
  onDateRangeChange,
}: CustomerOrderTableProps) => {
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery)
  const [statusFilter, setStatusFilter] = useState("all")
  const [paymentFilter, setPaymentFilter] = useState("all")
  const [activeTab, setActiveTab] = useState("all-orders")
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set())

  // Filter customer orders based on search query, filters, and active tab
  const filteredOrders = customerOrders.filter((order) => {
    // Search filter
    const matchesSearch =
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer.toLowerCase().includes(searchQuery.toLowerCase())

    // Status filter
    const matchesStatus = statusFilter === "all" || order.status.toLowerCase() === statusFilter.toLowerCase()

    // Payment status filter
    const matchesPayment = paymentFilter === "all" || order.paymentStatus.toLowerCase() === paymentFilter.toLowerCase()

    // Date range filter
    let matchesDate = true
    if (dateRange?.from) {
      const orderDate = new Date(order.date)
      if (dateRange.to) {
        matchesDate = isWithinInterval(orderDate, {
          start: startOfDay(dateRange.from),
          end: endOfDay(dateRange.to)
        })
      } else {
         matchesDate = isWithinInterval(orderDate, {
           start: startOfDay(dateRange.from),
           end: endOfDay(dateRange.from)
        })
      }
    }

    // Tab filter - filter by status based on active tab
    let matchesTab = true
    if (activeTab === "pending") {
      matchesTab = order.status === "Pending" || order.status === "Draft"
    } else if (activeTab === "processing") {
      matchesTab = order.status === "Processing" || order.status === "Submitted"
    } else if (activeTab === "completed") {
      matchesTab = order.status === "Completed" || order.status === "Fulfilled" || order.status === "Delivered"
    }
    // activeTab === "all-orders" matches everything

    return matchesSearch && matchesStatus && matchesPayment && matchesTab && matchesDate
  })

  // Get selected orders details
  const getSelectedOrders = () => {
    return filteredOrders.filter(order => selectedOrders.has(order.id))
  }

  const selectedOrdersList = getSelectedOrders()
  const selectedTotal = selectedOrdersList.reduce((sum, order) => sum + order.total, 0)

  // Handle checkbox toggle
  const toggleOrderSelection = (orderId: string) => {
    const newSelected = new Set(selectedOrders)
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId)
    } else {
      newSelected.add(orderId)
    }
    setSelectedOrders(newSelected)
  }

  // Select all from same customer
  const selectAllFromCustomer = () => {
    if (selectedOrdersList.length === 0) return
    
    const firstOrder = selectedOrdersList[0]
    const customer = firstOrder.customer
    
    const ordersFromSameCustomer = filteredOrders.filter(
      order => order.customer === customer && order.status !== "Cancelled"
    )
    
    const newSelected = new Set<string>()
    ordersFromSameCustomer.forEach(order => newSelected.add(order.id))
    setSelectedOrders(newSelected)
  }

  // Handle bulk payment
  const handleBulkPayment = () => {
    if (onBulkPayment && selectedOrdersList.length > 0) {
      onBulkPayment(selectedOrdersList)
    }
  }

  return (
    
   
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <TabsList>
                <TabsTrigger value="all-orders">All Orders</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="processing">Processing</TabsTrigger>
                <TabsTrigger value="completed">Delivered</TabsTrigger>
              </TabsList>

              {/* Bulk Actions Bar */}
              {selectedOrders.size > 0 && (
                <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-md">
                  <span className="text-sm font-medium">
                    {selectedOrders.size} selected • Total: ₱{formatCurrency(selectedTotal)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={selectAllFromCustomer}
                    disabled={selectedOrdersList.length === 0}
                  >
                    Select All from Customer
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleBulkPayment}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <PhilippinePesoIcon className="h-4 w-4 mr-1" />
                    Create Bulk Payment
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedOrders(new Set())}
                  >
                    Clear
                  </Button>
                </div>
              )}

              <div className="flex flex-1 items-center gap-2 max-w-md ml-auto">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search by Order# or customer..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <DateRangePicker 
                    date={dateRange} 
                    onDateChange={onDateRangeChange}
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[200px]">
                    <DropdownMenuLabel>Filter By</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <div className="p-2">
                      <p className="text-sm font-medium mb-2">Status</p>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <DropdownMenuSeparator />
                    <div className="p-2">
                      <p className="text-sm font-medium mb-2">Payment Status</p>
                      <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select payment status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Payment Status</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="refunded">Refunded</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
                {/* <Button variant="outline" size="icon">
                  <Calendar className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon">
                  <Download className="h-4 w-4" />
                </Button> */}
              </div>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <span className="sr-only">Select</span>
                    </TableHead>
                    <TableHead>Customer Order Number</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Items</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Delivery Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="h-24 text-center">
                        No results found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedOrders.has(order.id)}
                            onCheckedChange={() => toggleOrderSelection(order.id)}
                            disabled={order.status === "Cancelled"}
                            aria-label={`Select order ${order.id}`}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{order.co_number}</TableCell>
                        <TableCell>{order.date}</TableCell>
                        <TableCell>{order.customer}</TableCell>
                        <TableCell className="text-right">{order.items}</TableCell>
                        <TableCell className="text-right font-medium">₱{formatCurrency(order.total)}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              order.status === "Completed" || order.status === "Fulfilled" || order.status === "Delivered"
                                ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                                : order.status === "Processing" || order.status === "Submitted"
                                  ? "bg-blue-100 text-blue-700 hover:bg-blue-100"
                                  : order.status === "Pending" || order.status === "Draft"
                                    ? "bg-amber-100 text-amber-700 hover:bg-amber-100"
                                    : "bg-rose-100 text-rose-700 hover:bg-rose-100"
                            }
                          >
                            <span className="flex items-center">
                              {(order.status === "Processing" || order.status === "Submitted") && <Clock className="h-3.5 w-3.5 mr-1" />}
                              {(order.status === "Completed" || order.status === "Fulfilled" || order.status === "Delivered") && <CheckCircle className="h-3.5 w-3.5 mr-1" />}
                              {(order.status === "Pending" || order.status === "Draft") && <AlertCircle className="h-3.5 w-3.5 mr-1" />}
                              {order.status === "Cancelled" && <XCircle className="h-3.5 w-3.5 mr-1" />}
                              {order.status === "Draft" ? "Pending" :
                               order.status === "Submitted" ? "Processing" :
                               order.status === "Fulfilled" ? "Delivered" :
                               order.status}
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {order.status !== "Cancelled" && order.paymentStatus && (
                            <Badge
                              variant="outline"
                              className={
                                order.paymentStatus === "Paid" || order.paymentStatus === "paid"
                                  ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                                  : order.paymentStatus === "Partial" || order.paymentStatus === "partial"
                                    ? "bg-blue-100 text-blue-700 hover:bg-blue-100"
                                    : "bg-amber-100 text-amber-700 hover:bg-amber-100"
                              }
                            >
                              {(order.paymentStatus === "pending" || order.paymentStatus === "Pending") 
                                ? "Pending" 
                                : (order.paymentStatus === "partial" || order.paymentStatus === "Partial")
                                  ? "Partial"
                                  : "Paid"}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{order.deliveryDate ? format(new Date(order.deliveryDate), 'MMM dd, yyyy') : 'N/A'}</TableCell>
                        <TableCell className="text-right flex justify-end gap-2 items-center">
                          <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-8 w-8 p-0"
                              onClick={() => onEdit?.(order)}
                              title="Edit Order"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-8 w-8 p-0"
                              onClick={() => onPrint?.(order)}
                              title="Print Order"
                            >
                              <Printer className="h-4 w-4" />
                            </Button>
                          <DropdownMenu modal={false}>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem asChild>
                                  <Link href={`/customer-orders/${order.id}`}>
                                    <FileText className="h-4 w-4 mr-2" />
                                    View Details
                                  </Link>
                                </DropdownMenuItem>
                                
                                <DropdownMenuItem onSelect={() => onDownloadPDF?.(order)}>
                                <Download className="h-4 w-4 mr-2" />
                                Download PDF
                                </DropdownMenuItem>

                                <DropdownMenuItem onSelect={() => onPrint?.(order)}>
                                <span className="h-4 w-4 mr-2">🖨️</span>
                                Print Order
                                </DropdownMenuItem>
                                
                                {order.status !== "Delivered" && order.status !== "Completed" && order.status !== "Cancelled" && (
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onSelect={() => onFulfill?.(order)}>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Mark as Delivered
                                    </DropdownMenuItem>
                                </>
                                )}
                                {order.paymentStatus !== "Paid" && order.paymentStatus !== "paid" && (
                                    <DropdownMenuItem onSelect={() => onAddPayment?.(order)}>
                                    <CreditCard className="h-4 w-4 mr-2" />
                                    Add Payment
                                    </DropdownMenuItem>
                                )}
                                {order.status === "Draft" && (
                                    <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem 
                                            className="text-destructive"
                                            onSelect={() => onDelete?.(order)}
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete Order
                                        </DropdownMenuItem>
                                    </>
                                )}
                                {order.status !== "Cancelled" && order.status !== "Delivered" && order.status !== "Completed" && order.status !== "Draft" && (
                                <DropdownMenuItem 
                                    className="text-destructive"
                                    onSelect={() => onCancel?.(order)}
                                >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Cancel Order
                                </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Tabs>
  )
}

export default CustomerOrderTable