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
import { fetchCustomerOrders } from "@/src/lib/api/customer-orders";
import { fetchRepairs } from "@/src/lib/api/repairs";
import { adaptRepair } from "@/src/lib/adapters";
import { getSetting, upsertSetting } from "@/src/lib/api/settings";
import { DateRange } from "react-day-picker";

import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/src/components/ui/tabs";
import { X } from "lucide-react";
import { Button } from "@/src/components/ui/button";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/src/components/ui/select";

export default function BillingPage() {
    const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);
    const [customerTabs, setCustomerTabs] = useState<CustomerBillingTab[]>([]);
    const [activeTab, setActiveTab] = useState<string>("");
    const [itemFilter, setItemFilter] = useState<"all" | "products" | "repairs">("all");

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

    // Ref for the content to print (the visible table)
    const printRef = useRef<HTMLDivElement>(null);

    // Load format settings from backend
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const setting = await getSetting("billing_format_settings");
                if (setting && setting.value) {
                    setFormatSettings(setting.value);
                }
            } catch (error) {
                console.error("Failed to load billing format settings", error);
                // Fallback to localStorage if backend fails
                const saved = localStorage.getItem("pos_billing_format_settings");
                if (saved) {
                    try {
                        setFormatSettings(JSON.parse(saved));
                    } catch (e) {
                        console.error("Failed to parse local settings", e);
                    }
                }
            }
        };
        loadSettings();
    }, []);

    // Save format settings to backend whenever they change
    useEffect(() => {
        const saveSettings = async () => {
            try {
                await upsertSetting("billing_format_settings", formatSettings, "Billing document format preferences");
                // Also save to localStorage as backup
                localStorage.setItem("pos_billing_format_settings", JSON.stringify(formatSettings));
            } catch (error) {
                console.error("Failed to save billing format settings", error);
                // Still save to localStorage even if backend fails
                localStorage.setItem("pos_billing_format_settings", JSON.stringify(formatSettings));
            }
        };
        // Don't save on initial load
        if (JSON.stringify(formatSettings) !== JSON.stringify(DEFAULT_FORMAT_SETTINGS)) {
            saveSettings();
        }
    }, [formatSettings]);

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
            const [ordersResponse, repairsResponse] = await Promise.all([
                fetchCustomerOrders({
                    customer_ids: selectedCustomerIds,
                    date_from: dateRange.from.toISOString(),
                    date_to: dateRange.to.toISOString(),
                    per_page: 1000 // Fetch all
                }),
                fetchRepairs({
                    customer_ids: selectedCustomerIds,
                    date_from: dateRange.from.toISOString(),
                    date_to: dateRange.to.toISOString(),
                    per_page: 1000
                })
            ]);

            const newStatements: Record<string, BillingStatement | null> = {};

            selectedCustomerIds.forEach(customerId => {
                const customer = availableCustomers.find(c => c.id.toString() === customerId);
                if (!customer) return;

                // Adapt repairs to domain type
                const adaptedRepairs = (repairsResponse.data || []).map(adaptRepair);

                // Filter transactions/repairs for this customer in memory
                // Although API filtered by ID list, we separate them per customer for the statement
                const custOrders = ordersResponse.data.filter(o => 
                   String(o.customer_id) === customerId
                );
                
                const custRepairs = adaptedRepairs.filter((r) => 
                    r.customerId === customerId
                );

                const finalOrders = itemFilter === "repairs" ? [] : custOrders;
                const finalRepairs = itemFilter === "products" ? [] : custRepairs;

                newStatements[customerId] = generateBillingStatement(
                    customer,
                    finalRepairs,
                    finalOrders, 
                    {
                        startDate: dateRange.from!,
                        endDate: dateRange.to!,
                    }
                );
            });

            setStatements(newStatements);

        } catch (error) {
            console.error("Failed to generate billing", error);
        } finally {
            setIsLoadingData(false);
        }
    }, [dateRange, selectedCustomerIds, availableCustomers, itemFilter]);


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

                        {/* Item Type Filter */}
                        <div className="grid gap-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Include Items
                            </label>
                            <Select 
                                value={itemFilter} 
                                onValueChange={(value: "all" | "products" | "repairs") => setItemFilter(value)}
                            >
                                <SelectTrigger className="w-[280px]">
                                    <SelectValue placeholder="Select items to include" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Items (Products & Repairs)</SelectItem>
                                    <SelectItem value="products">Products Only</SelectItem>
                                    <SelectItem value="repairs">Repairs Only</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
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
