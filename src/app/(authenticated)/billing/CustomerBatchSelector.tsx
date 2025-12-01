"use client";

import React, { useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/src/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/src/components/ui/popover";
import { Badge } from "@/src/components/ui/badge";
import { cn } from "@/src/lib/utils";
import { Customer } from "@/src/types/customer";

interface CustomerBatchSelectorProps {
    customers: Customer[];
    selectedCustomerIds: string[];
    onSelectionChange: (customerIds: string[]) => void;
    onGenerateBilling: () => void;
}

export function CustomerBatchSelector({
    customers,
    selectedCustomerIds,
    onSelectionChange,
    onGenerateBilling,
}: CustomerBatchSelectorProps) {
    const [open, setOpen] = useState(false);

    const toggleCustomer = (customerId: string) => {
        const newSelection = selectedCustomerIds.includes(customerId)
            ? selectedCustomerIds.filter((id) => id !== customerId)
            : [...selectedCustomerIds, customerId];
        onSelectionChange(newSelection);
    };

    const removeCustomer = (customerId: string) => {
        onSelectionChange(selectedCustomerIds.filter((id) => id !== customerId));
    };

    const selectAll = () => {
        onSelectionChange(customers.map((c) => c.id.toString()));
    };

    const clearAll = () => {
        onSelectionChange([]);
    };

    const selectedCustomers = customers.filter((c) =>
        selectedCustomerIds.includes(c.id.toString())
    );

    return (
        <div className="space-y-3">
            <div className="flex gap-2 items-start">
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={open}
                            className="w-full justify-between"
                        >
                            <span className="truncate">
                                {selectedCustomerIds.length === 0
                                    ? "Select customers..."
                                    : `${selectedCustomerIds.length} customer${selectedCustomerIds.length > 1 ? "s" : ""} selected`}
                            </span>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0">
                        <Command>
                            <CommandInput placeholder="Search customers..." />
                            <CommandList>
                                <CommandEmpty>No customers found.</CommandEmpty>
                                <CommandGroup>
                                    <CommandItem
                                        onSelect={selectAll}
                                        className="font-medium border-b"
                                    >
                                        Select All ({customers.length})
                                    </CommandItem>
                                    {selectedCustomerIds.length > 0 && (
                                        <CommandItem
                                            onSelect={clearAll}
                                            className="font-medium border-b text-destructive"
                                        >
                                            Clear All
                                        </CommandItem>
                                    )}
                                    {customers.map((customer) => (
                                        <CommandItem
                                            key={customer.id}
                                            value={`${customer.name} ${customer.email}`}
                                            onSelect={() => toggleCustomer(customer.id.toString())}
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    selectedCustomerIds.includes(customer.id.toString())
                                                        ? "opacity-100"
                                                        : "opacity-0"
                                                )}
                                            />
                                            <div className="flex flex-col flex-1">
                                                <span className="font-medium">{customer.name}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    {customer.email}
                                                </span>
                                            </div>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
                <Button
                    onClick={onGenerateBilling}
                    disabled={selectedCustomerIds.length === 0}
                >
                    Generate Billing
                </Button>
            </div>

            {selectedCustomers.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {selectedCustomers.map((customer) => (
                        <Badge
                            key={customer.id}
                            variant="secondary"
                            className="pl-2 pr-1 py-1 gap-1"
                        >
                            <span>{customer.name}</span>
                            <button
                                onClick={() => removeCustomer(customer.id.toString())}
                                className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    ))}
                </div>
            )}
        </div>
    );
}
