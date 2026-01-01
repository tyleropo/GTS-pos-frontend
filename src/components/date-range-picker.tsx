"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, subDays } from "date-fns"
import { DateRange } from "react-day-picker"

import { cn } from "@/src/lib/utils"
import { Button } from "@/src/components/ui/button"
import { Calendar } from "@/src/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select"

interface DateRangePickerProps {
  date?: DateRange
  onDateChange?: (date?: DateRange) => void
  className?: string
}

export function DateRangePicker({
  date,
  onDateChange,
  className,
}: DateRangePickerProps) {
  const [selectedPreset, setSelectedPreset] = React.useState<string>("custom")

  const handlePresetChange = (value: string) => {
    setSelectedPreset(value)
    const today = new Date()

    let newDate: DateRange | undefined

    switch (value) {
      case "this-week":
        newDate = {
          from: startOfWeek(today),
          to: endOfWeek(today),
        }
        break
      case "last-week":
        const lastWeek = subDays(today, 7)
        newDate = {
          from: startOfWeek(lastWeek),
          to: endOfWeek(lastWeek),
        }
        break
      case "this-month":
        newDate = {
          from: startOfMonth(today),
          to: endOfMonth(today),
        }
        break
      case "last-month":
        const lastMonth = subDays(startOfMonth(today), 1)
        newDate = {
          from: startOfMonth(lastMonth),
          to: endOfMonth(lastMonth),
        }
        break
      case "this-quarter":
        newDate = {
          from: startOfQuarter(today),
          to: endOfQuarter(today),
        }
        break
       case "last-quarter":
        const lastQuarter = subDays(startOfQuarter(today), 1)
        newDate = {
            from: startOfQuarter(lastQuarter),
            to: endOfQuarter(lastQuarter)
        }
        break;
      case "custom":
        newDate = undefined
        break
    }

    if (newDate && onDateChange) {
      onDateChange(newDate)
    }
  }

  // Handle manual calendar selection
  const handleCalendarSelect = (newDate: DateRange | undefined) => {
      setSelectedPreset("custom"); // Switch to custom when manually picking
      if (onDateChange) {
          onDateChange(newDate);
      }
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            size="icon"
            className={cn(
              "h-9 w-9", 
              !date && "text-muted-foreground",
              className
            )}
          >
            <CalendarIcon className="h-4 w-4" />
            <span className="sr-only">Pick a date range</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <div className="p-4 border-b">
             <Select value={selectedPreset} onValueChange={handlePresetChange}>
                <SelectTrigger>
                    <SelectValue placeholder="Select a range" />
                </SelectTrigger>
                <SelectContent position="popper">
                    <SelectItem value="custom">Custom Range</SelectItem>
                    <SelectItem value="this-week">This Week</SelectItem>
                    <SelectItem value="last-week">Last Week</SelectItem>
                    <SelectItem value="this-month">This Month</SelectItem>
                    <SelectItem value="last-month">Last Month</SelectItem>
                    <SelectItem value="this-quarter">This Quarter</SelectItem>
                    <SelectItem value="last-quarter">Last Quarter</SelectItem>
                </SelectContent>
             </Select>
          </div>
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleCalendarSelect}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
