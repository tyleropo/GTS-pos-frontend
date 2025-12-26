"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
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
import { generateBillingStatement, getCurrentQuarter } from "@/src/lib/billing";
import {
    BillingStatement,
    DocumentFormatSettings,
    BillingPeriodType,
    CustomerBillingTab,
    DEFAULT_FORMAT_SETTINGS,
} from "@/src/types/billing";
import { fetchCustomers } from "@/src/lib/api/customers";
import { type Customer } from "@/src/types/customer";
import { fetchTransactions } from "@/src/lib/api/transactions";
import { fetchRepairs } from "@/src/lib/api/repairs";
import { Repair } from "@/src/types/repair";
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

    // Fetch real customers
    const [availableCustomers, setAvailableCustomers] = useState<Customer[]>([]);
    
    useEffect(() => {
        const loadCustomers = async () => {
            try {
                // Fetch all customers (or enough for the selector)
                const response = await fetchCustomers({ per_page: 100 });
                // Cast to any because API status 'string' vs "Active"|"Inactive" mismatch
                setAvailableCustomers(response.data as unknown as Customer[]);
            } catch (error) {
                console.error("Failed to load customers", error);
            }
        };
        loadCustomers();
    }, []);

    // Generate statements for all customer tabs
    const [statements, setStatements] = useState<Record<string, BillingStatement | null>>({});
    const [isLoadingData, setIsLoadingData] = useState(false);

    const handleGenerateBilling = useCallback(async () => {
        if (!dateRange?.from || !dateRange?.to || selectedCustomerIds.length === 0) return;

        setIsLoadingData(true);
        try {
            // Update tabs immediately
            const newTabs: CustomerBillingTab[] = selectedCustomerIds.map((id) => {
                const customer = availableCustomers.find((c) => c.id.toString() === id);
                return {
                    customerId: id,
                    customerName: customer?.name || "Unknown",
                    isActive: false,
                };
            });
            setCustomerTabs(newTabs);
            setActiveTab(newTabs[0]?.customerId ?? "");

            // Fetch data for all selected customers
            // Optimization: We could fetch once with comma-separated IDs if API supports it,
            // or parallel fetch per customer. Let's do a single bulk fetch if controller allows,
            // but for safety/granularity, we'll map.
             
            // Actually, TransactionController now enables "customer_ids" list.
            const [txResponse, repairsResponse] = await Promise.all([
                fetchTransactions({
                    customer_ids: selectedCustomerIds,
                    start_date: dateRange.from.toISOString(),
                    end_date: dateRange.to.toISOString(),
                    per_page: 1000 // Fetch all
                }),
                fetchRepairs({
                    customer_ids: selectedCustomerIds,
                    start_date: dateRange.from.toISOString(),
                    end_date: dateRange.to.toISOString(),
                    per_page: 1000
                })
            ]);

            const newStatements: Record<string, BillingStatement | null> = {};

            selectedCustomerIds.forEach(customerId => {
                const customer = availableCustomers.find(c => c.id.toString() === customerId);
                if (!customer) return;

                // Filter transactions/repairs for this customer in memory since we bulk fetched
                // (Or if API returned exact match, but we have mixed results)
                const custTransactions = txResponse.data.filter(t => 
                   String(t.customer_id) === customerId
                );
                // Repairs API might need similar filter if it doesn't separate them by default (it returns array)
                // Assuming `fetchRepairs` returns `data` array similar to transactions
                const custRepairs = (repairsResponse.data || []).filter((r: Repair) => 
                    String(r.customer_id) === customerId
                );

                newStatements[customerId] = generateBillingStatement(
                    customer,
                    custRepairs,
                    custTransactions as any, // Temporary cast until Transaction type unification
                    {
                        startDate: dateRange.from!,
                        endDate: dateRange.to!,
                    }
                );
            });

            setStatements(newStatements);

        } catch (error) {
            console.error("Failed to generate billing", error);
            // Optionally show toast
        } finally {
            setIsLoadingData(false);
        }
    }, [dateRange, selectedCustomerIds, availableCustomers]);


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
            
            // Cleanup statement
            setStatements(prev => {
                const next = { ...prev };
                delete next[customerId];
                return next;
            });
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
                                customers={availableCustomers}
                                selectedCustomerIds={selectedCustomerIds}
                                onSelectionChange={setSelectedCustomerIds}
                                onGenerateBilling={handleGenerateBilling}
                                isLoading={isLoadingData}
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
                                            settings={formatSettings}
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
