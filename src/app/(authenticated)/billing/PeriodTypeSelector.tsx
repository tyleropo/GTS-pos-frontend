"use client";

import React from "react";
import { Label } from "@/src/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/src/components/ui/select";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "./DateRangePicker";
import {
    getPeriodFromQuarter,
    getQuarterInfo,
    getMonthlyPeriod,
} from "@/src/lib/billing";
import { BillingPeriod, BillingPeriodType } from "@/src/types/billing";
import { RadioGroup, RadioGroupItem } from "@/src/components/ui/radio-group";

interface PeriodTypeSelectorProps {
    periodType: BillingPeriodType;
    onPeriodTypeChange: (type: BillingPeriodType) => void;
    dateRange: DateRange | undefined;
    onDateRangeChange: (range: DateRange | undefined) => void;
}

export function PeriodTypeSelector({
    periodType,
    onPeriodTypeChange,
    dateRange,
    onDateRangeChange,
}: PeriodTypeSelectorProps) {
    const currentDate = new Date();
    const currentQuarterInfo = getQuarterInfo(currentDate);
    const [selectedQuarter, setSelectedQuarter] = React.useState(
        currentQuarterInfo.quarter
    );
    const [selectedYear, setSelectedYear] = React.useState(
        currentQuarterInfo.year
    );
    const [selectedMonth, setSelectedMonth] = React.useState(
        currentDate.getMonth()
    );
    const [selectedMonthYear, setSelectedMonthYear] = React.useState(
        currentDate.getFullYear()
    );

    // Update date range when quarter/month changes
    React.useEffect(() => {
        if (periodType === "quarterly") {
            const period = getPeriodFromQuarter(selectedQuarter, selectedYear);
            onDateRangeChange({
                from: period.startDate,
                to: period.endDate,
            });
        } else if (periodType === "monthly") {
            const period = getMonthlyPeriod(
                new Date(selectedMonthYear, selectedMonth, 1)
            );
            onDateRangeChange({
                from: period.startDate,
                to: period.endDate,
            });
        }
    }, [
        periodType,
        selectedQuarter,
        selectedYear,
        selectedMonth,
        selectedMonthYear,
        onDateRangeChange,
    ]);

    const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - i);
    const months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
    ];

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label>Billing Period Type</Label>
                <RadioGroup
                    value={periodType}
                    onValueChange={(value) =>
                        onPeriodTypeChange(value as BillingPeriodType)
                    }
                    className="flex gap-4"
                >
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="quarterly" id="quarterly" />
                        <Label htmlFor="quarterly" className="font-normal cursor-pointer">
                            Quarterly
                        </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="monthly" id="monthly" />
                        <Label htmlFor="monthly" className="font-normal cursor-pointer">
                            Monthly
                        </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="custom" id="custom" />
                        <Label htmlFor="custom" className="font-normal cursor-pointer">
                            Custom Range
                        </Label>
                    </div>
                </RadioGroup>
            </div>

            {periodType === "quarterly" && (
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Quarter</Label>
                        <Select
                            value={selectedQuarter.toString()}
                            onValueChange={(value) => setSelectedQuarter(parseInt(value))}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1">Q1 (Jan - Mar)</SelectItem>
                                <SelectItem value="2">Q2 (Apr - Jun)</SelectItem>
                                <SelectItem value="3">Q3 (Jul - Sep)</SelectItem>
                                <SelectItem value="4">Q4 (Oct - Dec)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Year</Label>
                        <Select
                            value={selectedYear.toString()}
                            onValueChange={(value) => setSelectedYear(parseInt(value))}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {years.map((year: number) => (
                                    <SelectItem key={year} value={year.toString()}>
                                        {year}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            )}

            {periodType === "monthly" && (
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Month</Label>
                        <Select
                            value={selectedMonth.toString()}
                            onValueChange={(value) => setSelectedMonth(parseInt(value))}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {months.map((month, index) => (
                                    <SelectItem key={index} value={index.toString()}>
                                        {month}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Year</Label>
                        <Select
                            value={selectedMonthYear.toString()}
                            onValueChange={(value) => setSelectedMonthYear(parseInt(value))}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {years.map((year: number) => (
                                    <SelectItem key={year} value={year.toString()}>
                                        {year}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            )}

            {periodType === "custom" && (
                <div className="space-y-2">
                    <Label>Date Range</Label>
                    <DateRangePicker
                        dateRange={dateRange}
                        onDateRangeChange={onDateRangeChange}
                    />
                </div>
            )}
        </div>
    );
}
