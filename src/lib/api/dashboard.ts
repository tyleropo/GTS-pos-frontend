"use client";

import { apiClient } from "@/src/lib/api-client";
import { productSchema } from "@/src/lib/api/products";
import { z } from "zod";
import type { AxiosRequestConfig } from "axios";

const metricSchema = z
  .object({
    id: z.string().optional(),
    title: z.string(),
    value: z.union([z.string(), z.number()]),
    percentage: z.union([z.string(), z.number()]).optional(),
    trend: z.enum(["up", "down", "neutral"]).optional().default("neutral"),
    hint: z.string().optional(),
  })
  .transform((metric) => ({
    id: metric.id ?? metric.title.toLowerCase().replace(/\s+/g, "-"),
    title: metric.title,
    value: metric.value,
    percentage:
      typeof metric.percentage === "number"
        ? `${metric.percentage.toFixed(1)}%`
        : metric.percentage ?? null,
    trend: metric.trend ?? "neutral",
    hint: metric.hint ?? "",
  }));

const metricsResponseSchema = z
  .object({
    cards: z.array(metricSchema).optional(),
    metrics: z.array(metricSchema).optional(),
    data: z.array(metricSchema).optional(),
  })
  .transform((payload) => payload.cards ?? payload.metrics ?? payload.data ?? []);

const randomId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const activityItemSchema = z
  .object({
    id: z.string().optional(),
    title: z.string(),
    description: z.string().optional(),
    time: z.string().optional(),
    created_at: z.string().optional(),
    meta: z.record(z.unknown()).optional(),
  })
  .transform((item) => ({
    id: item.id ?? randomId(),
    title: item.title,
    desc: item.description ?? "",
    time: item.time ?? item.created_at ?? "",
    meta: item.meta ?? {},
  }));

const repairsSchema = z
  .array(
    z
      .object({
        id: z.string(),
        ticket_number: z.string().optional(),
        customer_name: z.string().optional(),
        status: z.string().optional(),
      })
      .transform((repair) => ({
        id: repair.ticket_number ?? repair.id,
        customer: repair.customer_name ?? "N/A",
        status: repair.status ?? "pending",
      }))
  )
  .default([]);

export type DashboardMetric = z.infer<typeof metricSchema>;
export type DashboardActivityItem = z.infer<typeof activityItemSchema>;

export async function fetchDashboardMetrics(config?: AxiosRequestConfig) {
  const { data } = await apiClient.get("/dashboard/metrics", config);
  return metricsResponseSchema.parse(data);
}

export async function fetchDashboardActivity(config?: AxiosRequestConfig) {
  const { data } = await apiClient.get("/dashboard/recent-activity", config);
  return z.array(activityItemSchema).parse(data);
}

export async function fetchDashboardLowStock(config?: AxiosRequestConfig) {
  const { data } = await apiClient.get("/dashboard/low-stock", config);
  return z.array(productSchema).parse(data);
}

export async function fetchDashboardTopSelling(config?: AxiosRequestConfig) {
  const { data } = await apiClient.get("/dashboard/top-selling", config);
  return z.array(productSchema).parse(data);
}

export async function fetchDashboardPendingRepairs(
  config?: AxiosRequestConfig
) {
  const { data } = await apiClient.get("/dashboard/pending-repairs", config);
  return repairsSchema.parse(data);
}

const calendarEventSchema = z.object({
  id: z.string(),
  title: z.string(),
  start: z.string(),
  color: z.string(),
  extendedProps: z.object({
    type: z.enum(["po", "repair"]),
    id: z.union([z.string(), z.number()]),
    status: z.string(),
  }),
});

export type CalendarEvent = z.infer<typeof calendarEventSchema>;

export async function fetchDashboardCalendarEvents(
  config?: AxiosRequestConfig
) {
  const { data } = await apiClient.get("/dashboard/calendar-events", config);
  return z.array(calendarEventSchema).parse(data);
}
