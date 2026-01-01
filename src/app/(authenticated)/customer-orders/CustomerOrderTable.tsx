import React, { useState } from 'react'
import { format, isWithinInterval, startOfDay, endOfDay } from 'date-fns'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem } from '@/src/components/ui/dropdown-menu'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/src/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { Search, Filter, AlertCircle, MoreHorizontal, Edit, Download, FileText, CheckCircle, XCircle, Clock, Trash2, CreditCard } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/src/components/ui/table'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Badge } from '@/src/components/ui/badge'
import { CustomerOrder } from '@/src/types/customerOrder'
import Link from 'next/link'
import { DateRangePicker } from '@/src/components/date-range-picker'
import { DateRange } from 'react-day-picker'

interface CustomerOrderTableProps {
  customerOrders: CustomerOrder[];
  onEdit?: (order: CustomerOrder) => void;
  onDelete?: (order: CustomerOrder) => void;
  onFulfill?: (order: CustomerOrder) => void;
  onCancel?: (order: CustomerOrder) => void;
  onDownloadPDF?: (order: CustomerOrder) => void;
  onAddPayment?: (order: CustomerOrder) => void;
  dateRange?: DateRange;
  onDateRangeChange?: (range: DateRange | undefined) => void;
}

const CustomerOrderTable = ({
  customerOrders,
  onEdit,
  onDelete,
  onFulfill,
  onCancel,
  onDownloadPDF,
  onAddPayment,
  dateRange,
  onDateRangeChange,
}: CustomerOrderTableProps) => {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [paymentFilter, setPaymentFilter] = useState("all")
  const [activeTab, setActiveTab] = useState("all-orders")

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
  return (
    
   
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <TabsList>
                <TabsTrigger value="all-orders">All Orders</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="processing">Processing</TabsTrigger>
                <TabsTrigger value="completed">Delivered</TabsTrigger>
              </TabsList>

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
                      <TableCell colSpan={9} className="h-24 text-center">
                        No results found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.co_number}</TableCell>
                        <TableCell>{order.date}</TableCell>
                        <TableCell>{order.customer}</TableCell>
                        <TableCell className="text-right">{order.items}</TableCell>
                        <TableCell className="text-right font-medium">₱{order.total.toFixed(2)}</TableCell>
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