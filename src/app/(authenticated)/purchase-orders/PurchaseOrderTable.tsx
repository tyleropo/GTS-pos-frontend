import React, { useState } from 'react'
import { format } from 'date-fns'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem } from '@/src/components/ui/dropdown-menu'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/src/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { Search, Filter, AlertCircle, MoreHorizontal, Edit, Download, FileText, CheckCircle, XCircle, Clock, Trash2 } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/src/components/ui/table'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Badge } from '@/src/components/ui/badge'
import { PurchaseOrder } from '@/src/types/purchaseOrder'
import Link from 'next/link'

interface PurchaseOrderTableProps {
  purchaseOrders: PurchaseOrder[];
  onEdit?: (po: PurchaseOrder) => void;
  onDelete?: (po: PurchaseOrder) => void;
  onReceive?: (po: PurchaseOrder) => void;
  onCancel?: (po: PurchaseOrder) => void;
  onDownloadPDF?: (po: PurchaseOrder) => void;
}

const PurchaseOrderTable = ({
  purchaseOrders,
  onEdit,
  onDelete,
  onReceive,
  onCancel,
  onDownloadPDF,
}: PurchaseOrderTableProps) => {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [paymentFilter, setPaymentFilter] = useState("all")
  const [activeTab, setActiveTab] = useState("all-orders")

  // Filter purchase orders based on search query, filters, and active tab
  const filteredPOs = purchaseOrders.filter((po) => {
    // Search filter
    const matchesSearch =
      po.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      po.customer.toLowerCase().includes(searchQuery.toLowerCase())

    // Status filter
    const matchesStatus = statusFilter === "all" || po.status.toLowerCase() === statusFilter.toLowerCase()

    // Payment status filter
    const matchesPayment = paymentFilter === "all" || po.paymentStatus.toLowerCase() === paymentFilter.toLowerCase()

    // Tab filter - filter by status based on active tab
    let matchesTab = true
    if (activeTab === "pending") {
      matchesTab = po.status === "Pending" || po.status === "Draft"
    } else if (activeTab === "processing") {
      matchesTab = po.status === "Processing" || po.status === "Submitted"
    } else if (activeTab === "completed") {
      matchesTab = po.status === "Completed" || po.status === "Received" || po.status === "Delivered"
    }
    // activeTab === "all-orders" matches everything

    return matchesSearch && matchesStatus && matchesPayment && matchesTab
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
                    placeholder="Search by PO# or customer..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
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
                    <TableHead>PO Number</TableHead>
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
                  {filteredPOs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="h-24 text-center">
                        No results found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPOs.map((po) => (
                      <TableRow key={po.id}>
                        <TableCell className="font-medium">{po.po_number}</TableCell>
                        <TableCell>{po.date}</TableCell>
                        <TableCell>{po.customer}</TableCell>
                        <TableCell className="text-right">{po.items}</TableCell>
                        <TableCell className="text-right font-medium">₱{po.total.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              po.status === "Completed" || po.status === "Received" || po.status === "Delivered"
                                ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                                : po.status === "Processing" || po.status === "Submitted"
                                  ? "bg-blue-100 text-blue-700 hover:bg-blue-100"
                                  : po.status === "Pending" || po.status === "Draft"
                                    ? "bg-amber-100 text-amber-700 hover:bg-amber-100"
                                    : "bg-rose-100 text-rose-700 hover:bg-rose-100"
                            }
                          >
                            <span className="flex items-center">
                              {(po.status === "Processing" || po.status === "Submitted") && <Clock className="h-3.5 w-3.5 mr-1" />}
                              {(po.status === "Completed" || po.status === "Received" || po.status === "Delivered") && <CheckCircle className="h-3.5 w-3.5 mr-1" />}
                              {(po.status === "Pending" || po.status === "Draft") && <AlertCircle className="h-3.5 w-3.5 mr-1" />}
                              {po.status === "Cancelled" && <XCircle className="h-3.5 w-3.5 mr-1" />}
                              {po.status === "Draft" ? "Pending" :
                               po.status === "Submitted" ? "Processing" :
                               po.status === "Received" ? "Delivered" :
                               po.status}
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              po.paymentStatus === "Paid"
                                ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                                : po.paymentStatus === "Pending"
                                  ? "bg-amber-100 text-amber-700 hover:bg-amber-100"
                                  : "bg-rose-100 text-rose-700 hover:bg-rose-100"
                            }
                          >
                            {po.paymentStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>{po.deliveryDate ? format(new Date(po.deliveryDate), 'MMM dd, yyyy') : 'N/A'}</TableCell>
                        <TableCell className="text-right flex justify-end gap-2 items-center">
                          {po.status !== "Cancelled" && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-8 w-8 p-0"
                              onClick={() => onEdit?.(po)}
                              title="Edit Order"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
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
                                  <Link href={`/purchase-orders/${po.id}`}>
                                    <FileText className="h-4 w-4 mr-2" />
                                    View Details
                                  </Link>
                                </DropdownMenuItem>
                                
                                <DropdownMenuItem onSelect={() => onDownloadPDF?.(po)}>
                                <Download className="h-4 w-4 mr-2" />
                                Download PDF
                                </DropdownMenuItem>
                                
                                {po.status !== "Received" && po.status !== "Cancelled" && (
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onSelect={() => onReceive?.(po)}>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Receive Items
                                    </DropdownMenuItem>
                                </>
                                )}
                                {po.status === "Draft" && (
                                    <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem 
                                            className="text-destructive"
                                            onSelect={() => onDelete?.(po)}
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete Order
                                        </DropdownMenuItem>
                                    </>
                                )}
                                {po.status !== "Cancelled" && po.status !== "Received" && po.status !== "Draft" && (
                                <DropdownMenuItem 
                                    className="text-destructive"
                                    onSelect={() => onCancel?.(po)}
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

export default PurchaseOrderTable