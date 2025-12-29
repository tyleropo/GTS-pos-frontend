"use client";

import { useEffect, useMemo, useState } from "react";
import { CardMetric } from "@/src/components/card-metrics";
import Calendar from "@/src/components/calendar";
import { ActivityFeed } from "@/src/components/acitivity-feed";
import { LowStockList } from "@/src/components/low-stock-list";
import { TopSellingList } from "@/src/components/top-selling-list";
import { PendingRepairs } from "@/src/components/pending-repairs";
import { SiteHeader } from "@/src/components/site-header";
import {
  fetchDashboardActivity,
  fetchDashboardLowStock,
  fetchDashboardMetrics,
  fetchDashboardPendingRepairs,
  fetchDashboardTopSelling,
  fetchDashboardCalendarEvents,
  type CalendarEvent,
} from "@/src/lib/api/dashboard";
import { updatePurchaseOrder } from "@/src/lib/api/purchase-orders";
import { updateRepair } from "@/src/lib/api/repairs";
import { Product } from "@/src/lib/api/products";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Badge } from "@/src/components/ui/badge";
import { useAuth } from "@/src/providers/auth-provider";
import { toast } from "sonner";

type DashboardError = {
  context: string;
  message: string;
};

const messageFrom = (reason: unknown, fallback: string) =>
  reason instanceof Error ? reason.message : fallback;

export default function DashboardPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState<DashboardError[]>([]);
  const [metrics, setMetrics] = useState<
    Awaited<ReturnType<typeof fetchDashboardMetrics>>
  >([]);
  const [activity, setActivity] = useState<
    Awaited<ReturnType<typeof fetchDashboardActivity>>
  >([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [topSellingProducts, setTopSellingProducts] = useState<Product[]>([]);
  const [pendingRepairs, setPendingRepairs] = useState<
    Awaited<ReturnType<typeof fetchDashboardPendingRepairs>>
  >([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setErrors([]);

    async function loadDashboardData() {
      const [
        metricsResult,
        activityResult,
        lowStockResult,
        topSellingResult,
        pendingRepairsResult,
        calendarEventsResult,
      ] = await Promise.allSettled([
        fetchDashboardMetrics(),
        fetchDashboardActivity(),
        fetchDashboardLowStock(),
        fetchDashboardTopSelling(),
        fetchDashboardPendingRepairs(),
        fetchDashboardCalendarEvents(),
      ]);

      if (cancelled) return;

      const nextErrors: DashboardError[] = [];

      if (metricsResult.status === "fulfilled") {
        setMetrics(metricsResult.value);
      } else {
        nextErrors.push({
          context: "metrics",
          message: messageFrom(metricsResult.reason, "Unable to load metrics."),
        });
      }

      if (activityResult.status === "fulfilled") {
        setActivity(activityResult.value);
      } else {
        nextErrors.push({
          context: "activity",
          message: messageFrom(
            activityResult.reason,
            "Unable to load recent activity feed.",
          ),
        });
      }

      if (lowStockResult.status === "fulfilled") {
        setLowStockProducts(lowStockResult.value);
      } else {
        nextErrors.push({
          context: "inventory",
          message: messageFrom(
            lowStockResult.reason,
            "Unable to load low-stock information.",
          ),
        });
      }

      if (topSellingResult.status === "fulfilled") {
        setTopSellingProducts(topSellingResult.value);
      } else {
        nextErrors.push({
          context: "sales",
          message: messageFrom(
            topSellingResult.reason,
            "Unable to load top-selling products.",
          ),
        });
      }

      if (pendingRepairsResult.status === "fulfilled") {
        setPendingRepairs(pendingRepairsResult.value);
      } else {
        nextErrors.push({
          context: "repairs",
          message: messageFrom(
            pendingRepairsResult.reason,
            "Unable to load repair tickets.",
          ),
        });
      }

      if (calendarEventsResult.status === "fulfilled") {
        setCalendarEvents(calendarEventsResult.value);
      } else {
        // Calendar events are non-critical, just log
        console.warn("Failed to load calendar events", calendarEventsResult.reason);
      }

      setErrors(nextErrors);
      setIsLoading(false);
    }

    loadDashboardData();

    return () => {
      cancelled = true;
    };
  }, []);

  const lowStockList = useMemo(
    () =>
      lowStockProducts.slice(0, 5).map((product) => ({
        name: product.name,
        sku: product.sku,
        stock: product.stock_quantity,
      })),
    [lowStockProducts]
  );

  const topSellingList = useMemo(
    () =>
      topSellingProducts.slice(0, 5).map((product) => ({
        name: product.name,
        sku: product.sku,
        sold: product.total_sold ?? 0,
      })),
    [topSellingProducts]
  );

  const repairsList = useMemo(
    () =>
      pendingRepairs.slice(0, 5).map((repair) => ({
        id: repair.id,
        customer: repair.customer,
        status: repair.status,
      })),
    [pendingRepairs]
  );

  const hasBlockingError =
    !metrics.length && errors.length === 5 && !isLoading;

  const headerActions = user ? (
    <div className="flex items-center gap-2 text-xs sm:text-sm">
      <Badge variant="secondary" className="rounded-full">
        {user.first_name} {user.last_name}
      </Badge>
      <Badge variant="outline" className="rounded-full capitalize">
        {user.role}
      </Badge>
    </div>
  ) : (
    <Badge variant="outline" className="rounded-full">
      Not authenticated
    </Badge>
  );

  return (
    <div className="flex flex-col">
      <SiteHeader
        title="Operations overview"
        subtitle="Monitor sales performance, inventory health, and service commitments."
        actions={headerActions}
      />

      <div className="space-y-6 p-4 lg:p-6">
        {errors.length > 0 && !isLoading ? (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Some dashboard widgets failed to load. Please refresh the page or
            try again later.
          </div>
        ) : null}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {isLoading
            ? Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-32 rounded-xl" />
              ))
            : metrics.slice(0, 4).map((metric) => (
                <CardMetric
                  key={metric.id}
                  title={metric.title}
                  value={metric.value}
                  percentage={metric.percentage}
                  trend={metric.trend}
                  hint={metric.hint}
                  icon={metric.icon}
                  href={metric.href}
                />
              ))}
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Calendar 
              events={calendarEvents} 
              isLoading={isLoading}
              onEventDateChange={async (eventId, type, newDate) => {
                try {
                  if (type === 'po') {
                    await updatePurchaseOrder(eventId, { expected_at: newDate });
                    toast.success('PO delivery date updated');
                  } else {
                    await updateRepair(eventId, { promised_at: newDate });
                    toast.success('Repair due date updated');
                  }
                  // Refresh calendar events
                  const events = await fetchDashboardCalendarEvents();
                  setCalendarEvents(events);
                } catch (error) {
                  console.error('Failed to update date:', error);
                  toast.error('Failed to update date');
                }
              }}
            />
          </div>
          {isLoading ? (
            <Skeleton className="h-80 rounded-xl" />
          ) : (
            <ActivityFeed activity={activity} />
          )}
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {isLoading ? (
            <>
              <Skeleton className="h-60 rounded-xl" />
              <Skeleton className="h-60 rounded-xl" />
              <Skeleton className="h-60 rounded-xl" />
            </>
          ) : (
            <>
              <LowStockList items={lowStockList} />
              <TopSellingList products={topSellingList} />
              <PendingRepairs repairs={repairsList} />
            </>
          )}
        </section>

        {hasBlockingError ? (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-900">
            The dashboard could not retrieve any data from the API. Verify that
            the Laravel backend is reachable at the configured
            `NEXT_PUBLIC_API_URL`.
          </div>
        ) : null}
      </div>
    </div>
  );
}
