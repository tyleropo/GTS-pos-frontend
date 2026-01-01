"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  fetchSalesReport,
  fetchInventoryReport,
  fetchCustomerReport,
  fetchGovernmentMarkupReport,
  fetchPaymentReport,
  exportReport,
  type SalesReport,
  type InventoryReport,
  type CustomerReport,
  type GovernmentMarkupReport,
  type PaymentReport,
} from "@/src/lib/api/reports";
import { toast } from "sonner";
import { Download, BarChart3, Package, Users, BadgeDollarSign } from "lucide-react";
import { subDays, subMonths, subQuarters, subYears, startOfDay, endOfDay, format } from "date-fns";
import { SiteHeader } from "@/src/components/site-header";
import { formatCurrency } from "@/src/lib/format-currency";


type DateRangeType = "today" | "yesterday" | "last_7_days" | "last_30_days" | "this_month" | "last_month" | "this_quarter" | "last_quarter" | "this_year" | "last_year" | "custom";

export default function ReportsPage() {
  const [dateRangeType, setDateRangeType] = useState<DateRangeType>("last_30_days");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [salesData, setSalesData] = useState<SalesReport | null>(null);
  const [inventoryData, setInventoryData] = useState<InventoryReport | null>(null);
  const [customerData, setCustomerData] = useState<CustomerReport | null>(null);
  const [governmentData, setGovernmentData] = useState<GovernmentMarkupReport | null>(null);
  const [paymentData, setPaymentData] = useState<PaymentReport | null>(null);
  const [loading, setLoading] = useState("");

  const getDateRange = (type: DateRangeType): { from: string; to: string } => {
    const now = new Date();
    const today = startOfDay(now);
    
    switch (type) {
      case "today":
        return {
          from: format(today, "yyyy-MM-dd"),
          to: format(endOfDay(now), "yyyy-MM-dd"),
        };
      case "yesterday":
        const yesterday = subDays(today, 1);
        return {
          from: format(yesterday, "yyyy-MM-dd"),
          to: format(endOfDay(yesterday), "yyyy-MM-dd"),
        };
      case "last_7_days":
        return {
          from: format(subDays(today, 7), "yyyy-MM-dd"),
          to: format(endOfDay(now), "yyyy-MM-dd"),
        };
      case "last_30_days":
        return {
          from: format(subDays(today, 30), "yyyy-MM-dd"),
          to: format(endOfDay(now), "yyyy-MM-dd"),
        };
      case "this_month":
        return {
          from: format(new Date(now.getFullYear(), now.getMonth(), 1), "yyyy-MM-dd"),
          to: format(endOfDay(now), "yyyy-MM-dd"),
        };
      case "last_month":
        const lastMonth = subMonths(now, 1);
        return {
          from: format(new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1), "yyyy-MM-dd"),
          to: format(new Date(now.getFullYear(), now.getMonth(), 0), "yyyy-MM-dd"),
        };
      case "this_quarter":
        const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        return {
          from: format(quarterStart, "yyyy-MM-dd"),
          to: format(endOfDay(now), "yyyy-MM-dd"),
        };
      case "last_quarter":
        const lastQuarter = subQuarters(now, 1);
        const lastQuarterStart = new Date(lastQuarter.getFullYear(), Math.floor(lastQuarter.getMonth() / 3) * 3, 1);
        const lastQuarterEnd = new Date(lastQuarterStart.getFullYear(), lastQuarterStart.getMonth() + 3, 0);
        return {
          from: format(lastQuarterStart, "yyyy-MM-dd"),
          to: format(lastQuarterEnd, "yyyy-MM-dd"),
        };
      case "this_year":
        return {
          from: format(new Date(now.getFullYear(), 0, 1), "yyyy-MM-dd"),
          to: format(endOfDay(now), "yyyy-MM-dd"),
        };
      case "last_year":
        const lastYear = subYears(now, 1);
        return {
          from: format(new Date(lastYear.getFullYear(), 0, 1), "yyyy-MM-dd"),
          to: format(new Date(lastYear.getFullYear(), 11, 31), "yyyy-MM-dd"),
        };
      case "custom":
        return { from: dateFrom, to: dateTo };
      default:
        return { from: "", to: "" };
    }
  };

  const handleFetchSales = async () => {
    try {
      setLoading("sales");
      const range = getDateRange(dateRangeType);
      const data = await fetchSalesReport({ date_from: range.from, date_to: range.to });
      setSalesData(data);
      toast.success("Sales report loaded");
    } catch (error) {
      console.error("Sales report error:", error);
      toast.error("Failed to load sales report");
    } finally {
      setLoading("");
    }
  };

  const handleFetchInventory = async () => {
    try {
      setLoading("inventory");
      const data = await fetchInventoryReport();
      setInventoryData(data);
      toast.success("Inventory report loaded");
    } catch (error) {
      console.error("Inventory report error:", error);
      toast.error("Failed to load inventory report");
    } finally {
      setLoading("");
    }
  };

  const handleFetchCustomer = async () => {
    try {
      setLoading("customer");
      const range = getDateRange(dateRangeType);
      const data = await fetchCustomerReport({ date_from: range.from, date_to: range.to });
      setCustomerData(data);
      toast.success("Customer report loaded");
    } catch (error) {
      console.error("Customer report error:", error);
      toast.error("Failed to load customer report");
    } finally {
      setLoading("");
    }
  };

  const handleFetchGovernment = async () => {
    try {
      setLoading("government");
      const range = getDateRange(dateRangeType);
      const data = await fetchGovernmentMarkupReport({ date_from: range.from, date_to: range.to });
      setGovernmentData(data);
      toast.success("Government markup report loaded");
    } catch (error) {
      console.error("Government report error:", error);
      toast.error("Failed to load government markup report");
    } finally {
      setLoading("");
    }
  };

  const handleFetchPayment = async () => {
    try {
      setLoading("payment");
      const range = getDateRange(dateRangeType);
      const data = await fetchPaymentReport({ date_from: range.from, date_to: range.to });
      setPaymentData(data);
      toast.success("Payment report loaded");
    } catch (error) {
      console.error("Payment report error:", error);
      toast.error("Failed to load payment report");
    } finally {
      setLoading("");
    }
  };

  const handleExport = async (reportType: "sales" | "inventory" | "customer" | "government" | "payment") => {
    try {
      const range = getDateRange(dateRangeType);
      await exportReport({ report_type: reportType, date_from: range.from, date_to: range.to });
      toast.success("Report exported successfully");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export report");
    }
  };

  return (
    <div className="flex flex-col gap-5 p-4">
      <SiteHeader
        title="Reports & Analytics"
        subtitle="Generate and view comprehensive business reports."
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Date Range Filter</CardTitle>
          <CardDescription>Select a predefined range or custom dates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date-range-type">Date Range</Label>
              <Select
                value={dateRangeType}
                onValueChange={(value) => setDateRangeType(value as DateRangeType)}
              >
                <SelectTrigger id="date-range-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="last_7_days">Last 7 Days</SelectItem>
                  <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                  <SelectItem value="this_month">This Month</SelectItem>
                  <SelectItem value="last_month">Last Month</SelectItem>
                  <SelectItem value="this_quarter">This Quarter</SelectItem>
                  <SelectItem value="last_quarter">Last Quarter</SelectItem>
                  <SelectItem value="this_year">This Year</SelectItem>
                  <SelectItem value="last_year">Last Year</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {dateRangeType === "custom" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date-from">From</Label>
                <Input
                  id="date-from"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="date-to">To</Label>
                <Input
                  id="date-to"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
            </div>
          )}

          {dateRangeType !== "custom" && (
            <div className="text-sm text-muted-foreground">
              Selected range: {getDateRange(dateRangeType).from} to {getDateRange(dateRangeType).to}
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sales">
            <BarChart3 className="mr-2 h-4 w-4" />
            Sales
          </TabsTrigger>
          <TabsTrigger value="inventory">
            <Package className="mr-2 h-4 w-4" />
            Inventory
          </TabsTrigger>
          <TabsTrigger value="customer">
            <Users className="mr-2 h-4 w-4" />
            Customers
          </TabsTrigger>
          {/* <TabsTrigger value="government">
            <Receipt className="mr-2 h-4 w-4" />
            Government
          </TabsTrigger> */}
          <TabsTrigger value="payment">
            <BadgeDollarSign className="mr-2 h-4 w-4" />
            Payments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sales">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Sales Report</CardTitle>
                <CardDescription>Revenue and transaction analytics</CardDescription>
              </div>
              <div className="space-x-2">
                <Button onClick={handleFetchSales} disabled={loading === "sales"}>
                  {loading === "sales" ? "Loading..." : "Generate"}
                </Button>
                <Button variant="outline" onClick={() => handleExport("sales")}>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {salesData ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="border p-4 rounded">
                      <p className="text-sm text-muted-foreground">Total Revenue</p>
                      <p className="text-2xl font-bold">₱{formatCurrency(salesData.total_revenue)}</p>
                    </div>
                    <div className="border p-4 rounded">
                      <p className="text-sm text-muted-foreground">Transactions</p>
                      <p className="text-2xl font-bold">{salesData.total_transactions}</p>
                    </div>
                    <div className="border p-4 rounded">
                      <p className="text-sm text-muted-foreground">Avg Transaction</p>
                      <p className="text-2xl font-bold">₱{formatCurrency(salesData.average_transaction || 0)}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">Click &quot;Generate&quot; to load the sales report</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Inventory Report</CardTitle>
                <CardDescription>Stock levels and product analytics</CardDescription>
              </div>
              <div className="space-x-2">
                <Button onClick={handleFetchInventory} disabled={loading === "inventory"}>
                  {loading === "inventory" ? "Loading..." : "Generate"}
                </Button>
                <Button variant="outline" onClick={() => handleExport("inventory")}>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {inventoryData ? (
                <div className="grid grid-cols-3 gap-4">
                  <div className="border p-4 rounded">
                    <p className="text-sm text-muted-foreground">Total Products</p>
                    <p className="text-2xl font-bold">{inventoryData.total_products}</p>
                  </div>
                  <div className="border p-4 rounded">
                    <p className="text-sm text-muted-foreground">Stock Value</p>
                    <p className="text-2xl font-bold">₱{formatCurrency(inventoryData.total_stock_value)}</p>
                  </div>
                  <div className="border p-4 rounded">
                    <p className="text-sm text-muted-foreground">Out of Stock</p>
                    <p className="text-2xl font-bold text-destructive">{inventoryData.out_of_stock_products}</p>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">Click &quot;Generate&quot; to load the inventory report</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customer">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Customer Report</CardTitle>
                <CardDescription>Customer analytics and insights</CardDescription>
              </div>
              <div className="space-x-2">
                <Button onClick={handleFetchCustomer} disabled={loading === "customer"}>
                  {loading === "customer" ? "Loading..." : "Generate"}
                </Button>
                <Button variant="outline" onClick={() => handleExport("customer")}>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {customerData ? (
                <div className="border p-4 rounded">
                  <p className="text-sm text-muted-foreground">Total Customers</p>
                  <p className="text-2xl font-bold">{customerData.total_customers}</p>
                </div>
              ) : (
                <p className="text-muted-foreground">Click &quot;Generate&quot; to load the customer report</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="government">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Government Markup Report</CardTitle>
                <CardDescription>Government customer purchases and markups</CardDescription>
              </div>
              <div className="space-x-2">
                <Button onClick={handleFetchGovernment} disabled={loading === "government"}>
                  {loading === "government" ? "Loading..." : "Generate"}
                </Button>
                <Button variant="outline" onClick={() => handleExport("government")}>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {governmentData ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="border p-4 rounded">
                    <p className="text-sm text-muted-foreground">Total Orders</p>
                    <p className="text-2xl font-bold">{governmentData.total_government_orders}</p>
                  </div>
                  <div className="border p-4 rounded">
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                    <p className="text-2xl font-bold">₱{formatCurrency(governmentData.total_government_revenue)}</p>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">Click &quot;Generate&quot; to load the government markup report</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Payment Report</CardTitle>
                <CardDescription>Payment collection and status</CardDescription>
              </div>
              <div className="space-x-2">
                <Button onClick={handleFetchPayment} disabled={loading === "payment"}>
                  {loading === "payment" ? "Loading..." : "Generate"}
                </Button>
                <Button variant="outline" onClick={() => handleExport("payment")}>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {paymentData ? (
                <div className="grid grid-cols-3 gap-4">
                  <div className="border p-4 rounded">
                    <p className="text-sm text-muted-foreground">Total Collected</p>
                    <p className="text-2xl font-bold">₱{formatCurrency(paymentData.total_payments_collected)}</p>
                  </div>
                  <div className="border p-4 rounded">
                    <p className="text-sm text-muted-foreground">Payment Count</p>
                    <p className="text-2xl font-bold">{paymentData.total_payments_count}</p>
                  </div>
                  <div className="border p-4 rounded">
                    <p className="text-sm text-muted-foreground">Outstanding</p>
                    <p className="text-2xl font-bold text-warning">₱{formatCurrency(paymentData.outstanding_balance)}</p>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">Click &quot;Generate&quot; to load the payment report</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
