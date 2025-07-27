import { CardMetric } from "@/src/components/card-metrics";
import Calendar from "@/src/components/calendar";
import { ActivityFeed } from "@/src/components/acitivity-feed";
import { LowStockList } from "@/src/components/low-stock-list";
import { TopSellingList } from "@/src/components/top-selling-list";
import { PendingRepairs } from "@/src/components/pending-repairs";
import { SiteHeader } from "@/src/components/site-header";

export default function DashboardPage() {
  return (
    <div className="">
      <div className="flex items-center justify-between mb-4">
        <SiteHeader title="Dashboard" />
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Cashier: Admin User
          </span>
        </div>
      </div>
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <CardMetric
            title="Total Revenue"
            value="$1,250.00"
            percentage="+12.5%"
            trend="up"
            hint="Trending up this month"
          />
          <CardMetric
            title="New Customers"
            value="1,234"
            percentage="-20%"
            trend="down"
            hint="Acquisition needs attention"
          />
          <CardMetric
            title="Active Accounts"
            value="45,678"
            percentage="+12.5%"
            trend="up"
            hint="Strong user retention"
          />
          <CardMetric
            title="Growth Rate"
            value="4.5%"
            percentage="+4.5%"
            trend="up"
            hint="Meets growth projections"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <Calendar />
          </div>
          <ActivityFeed
            activity={[
              {
                title: "Inventory updated",
                desc: "5 items restocked",
                time: "10 min ago",
              },
              {
                title: "New sale completed",
                desc: "Customer purchased 3 items",
                time: "20 min ago",
              },
            ]}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <LowStockList
            items={[
              { name: "Product 1", sku: "SKU-001", stock: 1 },
              { name: "Product 2", sku: "SKU-002", stock: 2 },
              { name: "Product 3", sku: "SKU-003", stock: 3 },
            ]}
          />

          <TopSellingList
            products={[
              { name: "Top Product 1", sku: "SKU-101", sold: 80 },
              { name: "Top Product 2", sku: "SKU-102", sold: 60 },
              { name: "Top Product 3", sku: "SKU-103", sold: 40 },
            ]}
          />

          <PendingRepairs
            repairs={[
              { id: "#1001", customer: "John D." },
              { id: "#1002", customer: "John D." },
              { id: "#1003", customer: "John D." },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
