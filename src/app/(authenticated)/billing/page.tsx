"use client";

import React, { useState, useRef, useMemo, useCallback } from "react";
import { SiteHeader } from "@/src/components/site-header";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/src/components/ui/card";
import { ExportButtons } from "./ExportButtons";
import BillingStatementTable from "./BillingStatementTable";
import { CustomerBatchSelector } from "./CustomerBatchSelector";
import { PeriodTypeSelector } from "./PeriodTypeSelector";
import { customers } from "@/src/data/mockCustomers";
import { repairs } from "@/src/data/mockRepairs";
import mockTransactions from "@/src/data/mockTransactions";
import { generateBillingStatement, getCurrentQuarter } from "@/src/lib/billing";
import {
    BillingStatement,
    BillingPeriodType,
    CustomerBillingTab,
    DEFAULT_FORMAT_SETTINGS,
    DocumentFormatSettings,
} from "@/src/types/billing";
import { DateRange } from "react-day-picker";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/src/components/ui/tabs";
import { X } from "lucide-react";
import { Button } from "@/src/components/ui/button";

export default function BillingPage() {
    const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);
    const [customerTabs, setCustomerTabs] = useState<CustomerBillingTab[]>([]);
    const [activeTab, setActiveTab] = useState<string>("");

    // Default to quarterly period with current quarter
    const currentQuarter = getCurrentQuarter();
    const [periodType, setPeriodType] = useState<BillingPeriodType>("quarterly");
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: currentQuarter.startDate,
        to: currentQuarter.endDate,
    });

    const [formatSettings, setFormatSettings] = useState<DocumentFormatSettings>(
        DEFAULT_FORMAT_SETTINGS
    );

    const printRef = useRef<HTMLDivElement>(null);

    // Generate statements for all customer tabs
    const statements = useMemo(() => {
        const result: Record<string, BillingStatement | null> = {};

        if (!dateRange?.from || !dateRange?.to) {
            return result;
        }

        customerTabs.forEach((tab) => {
            const customer = customers.find((c) => c.id.toString() === tab.customerId);
            if (customer) {
                result[tab.customerId] = generateBillingStatement(
                    customer,
                    repairs,
                    mockTransactions,
                    {
                        startDate: dateRange.from!,
                        endDate: dateRange.to!,
                    }
                );
            }
        });

        return result;
    }, [customerTabs, dateRange]);

    const handleGenerateBilling = useCallback(() => {
        setCustomerTabs(() => {
            const newTabs: CustomerBillingTab[] = selectedCustomerIds.map((id) => {
                const customer = customers.find((c) => c.id.toString() === id);
                return {
                    customerId: id,
                    customerName: customer?.name || "Unknown",
                    isActive: false,
                };
            });

            setActiveTab(newTabs[0]?.customerId ?? "");
            return newTabs;
        });
    }, [selectedCustomerIds]);

    const handleCloseTab = useCallback(
        (customerId: string) => {
            setCustomerTabs((prevTabs) => {
                const updatedTabs = prevTabs.filter((tab) => tab.customerId !== customerId);

                if (activeTab === customerId) {
                    setActiveTab(updatedTabs[0]?.customerId ?? "");
                }

                return updatedTabs;
            });

            setSelectedCustomerIds((prev) => prev.filter((id) => id !== customerId));
        },
        [activeTab]
    );

    return (
        <div>
            <SiteHeader title="Billing & Statements" />
            <div className="p-4 space-y-6">
                {/* Controls Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold">
                            Generate Multi-Customer Billing
                        </CardTitle>
                        <CardDescription>
                            Select customers and billing period to generate statements in separate tabs
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Customer Selection */}
                        <div className="space-y-2">
                            <CustomerBatchSelector
                                customers={customers}
                                selectedCustomerIds={selectedCustomerIds}
                                onSelectionChange={setSelectedCustomerIds}
                                onGenerateBilling={handleGenerateBilling}
                            />
                        </div>

                        {/* Period Type Selection */}
                        <PeriodTypeSelector
                            periodType={periodType}
                            onPeriodTypeChange={setPeriodType}
                            dateRange={dateRange}
                            onDateRangeChange={setDateRange}
                        />
                    </CardContent>
                </Card>

                {/* Tabbed Statements */}
                {customerTabs.length > 0 && (
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Customer Statements</CardTitle>
                                <ExportButtons
                                    statement={statements[activeTab] || null}
                                    printRef={printRef}
                                    formatSettings={formatSettings}
                                    onFormatSettingsChange={setFormatSettings}
                                />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Tabs value={activeTab} onValueChange={setActiveTab}>
                                <TabsList className="w-full justify-start flex-wrap h-auto">
                                    {customerTabs.map((tab) => (
                                        <div
                                            key={tab.customerId}
                                            className="inline-flex items-center gap-1 group"
                                        >
                                            <TabsTrigger value={tab.customerId}>
                                                {tab.customerName}
                                            </TabsTrigger>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleCloseTab(tab.customerId);
                                                }}
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    ))}
                                </TabsList>
                                {customerTabs.map((tab) => (
                                    <TabsContent key={tab.customerId} value={tab.customerId}>
                                        <BillingStatementTable
                                            ref={activeTab === tab.customerId ? printRef : null}
                                            statement={statements[tab.customerId] || null}
                                        />
                                    </TabsContent>
                                ))}
                            </Tabs>
                        </CardContent>
                    </Card>
                )}

                {/* Empty State */}
                {customerTabs.length === 0 && (
                    <Card>
                        <CardContent className="py-12">
                            <div className="text-center text-muted-foreground">
                                <p className="text-lg font-medium mb-2">No billing statements generated</p>
                                <p className="text-sm">
                                    Select customers and click &quot;Generate Billing&quot; to create statements
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
