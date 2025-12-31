'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from "@/src/components/ui/card"
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import { Badge } from "@/src/components/ui/badge"
import { Button } from "@/src/components/ui/button"
import { Package, Wrench, Calendar as CalendarIcon, ExternalLink, X, ShoppingCart } from "lucide-react"
import type { CalendarEvent } from "@/src/lib/api/dashboard"
import type { EventClickArg, EventDropArg, EventHoveringArg } from '@fullcalendar/core'
import { toast } from "sonner"

interface CalendarProps {
  events?: CalendarEvent[];
  isLoading?: boolean;
  onEventDateChange?: (eventId: string, type: 'po' | 'repair' | 'co', newDate: string) => void;
}

interface SelectedEvent {
  id: string;
  title: string;
  eventNumber: string;
  date: string;
  type: 'po' | 'repair' | 'co';
  status: string;
  position: { x: number; y: number };
}

interface HoveredEvent {
  title: string;
  eventNumber: string;
  date: string;
  type: 'po' | 'repair' | 'co';
  status: string;
  position: { x: number; y: number };
}

export default function Calendar({ events = [], isLoading = false, onEventDateChange }: CalendarProps) {
  const [selectedEvent, setSelectedEvent] = useState<SelectedEvent | null>(null);
  const [hoveredEvent, setHoveredEvent] = useState<HoveredEvent | null>(null);

  // Convert events to FullCalendar format
  // Show short title (customer name only) in calendar, full title on hover/click
  const calendarEvents = events.map((event) => {
    // Title format is "ID - Customer Name", extract just the customer name for display
    const parts = event.title.split(' - ');
    const shortTitle = parts.length > 1 ? parts.slice(1).join(' - ') : event.title;
    const eventId = parts[0] || '';
    
    return {
      id: event.id,
      title: shortTitle, // Show only customer name in calendar cell
      start: event.start,
      backgroundColor: event.color,
      borderColor: event.color,
      extendedProps: {
        ...event.extendedProps,
        fullTitle: event.title, // Keep full title for hover/click
        eventNumber: eventId,   // Keep ID for display in popover
      },
    };
  });

  const handleEventClick = (clickInfo: EventClickArg) => {
    setHoveredEvent(null); // Close hover tooltip when clicking
    const rect = clickInfo.el.getBoundingClientRect();
    setSelectedEvent({
      id: clickInfo.event.id,
      title: clickInfo.event.extendedProps.fullTitle || clickInfo.event.title,
      eventNumber: clickInfo.event.extendedProps.eventNumber || '',
      date: clickInfo.event.startStr,
      type: clickInfo.event.extendedProps.type,
      status: clickInfo.event.extendedProps.status,
      position: {
        x: rect.left + rect.width / 2,
        y: rect.top,
      },
    });
  };

  const handleEventDrop = (dropInfo: EventDropArg) => {
    const newDate = dropInfo.event.startStr;
    const eventType = dropInfo.event.extendedProps.type as 'po' | 'repair' | 'co';
    const eventId = String(dropInfo.event.extendedProps.id);
    
    if (onEventDateChange) {
      onEventDateChange(eventId, eventType, newDate);
    } else {
      toast.info(`${eventType === 'po' ? 'PO' : eventType === 'co' ? 'Order' : 'Repair'} rescheduled to ${newDate}`);
    }
  };

  const handleEventMouseEnter = (info: EventHoveringArg) => {
    if (selectedEvent) return; // Don't show hover if click popover is open
    const rect = info.el.getBoundingClientRect();
    setHoveredEvent({
      title: info.event.extendedProps.fullTitle || info.event.title,
      eventNumber: info.event.extendedProps.eventNumber || '',
      date: info.event.startStr,
      type: info.event.extendedProps.type,
      status: info.event.extendedProps.status,
      position: {
        x: rect.left + rect.width / 2,
        y: rect.top,
      },
    });
  };

  const handleEventMouseLeave = () => {
    setHoveredEvent(null);
  };

  const closePopover = () => setSelectedEvent(null);

  const getEventIcon = (type: 'po' | 'repair' | 'co') => {
    if (type === 'po') return <Package className="h-4 w-4 text-blue-600" />;
    if (type === 'co') return <ShoppingCart className="h-4 w-4 text-purple-600" />;
    return <Wrench className="h-4 w-4 text-orange-600" />;
  };

  const getStatusBadge = (status: string, type: 'po' | 'repair' | 'co') => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'completed' || statusLower === 'received' || statusLower === 'fulfilled') {
      return <Badge className="bg-emerald-100 text-emerald-700">Completed</Badge>;
    }
    if (statusLower === 'in_progress' || statusLower === 'shipped') {
      return <Badge className="bg-blue-100 text-blue-700">{type === 'po' ? 'Shipped' : type === 'co' ? 'In Progress' : 'In Progress'}</Badge>;
    }
    return <Badge className="bg-amber-100 text-amber-700">Pending</Badge>;
  };

  const getViewLink = (type: 'po' | 'repair' | 'co') => {
    if (type === 'po') return `/purchase-orders`;
    if (type === 'co') return `/customer-orders`;
    return `/repairs`;
  };

  return (
    <Card className="h-full relative">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle>Upcoming Schedule</CardTitle>
          <div className="flex items-center gap-2 text-xs">
            <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200">
              <Package className="h-3 w-3 mr-1" />
              PO Deliveries
            </Badge>
            <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-200">
              <ShoppingCart className="h-3 w-3 mr-1" />
              Customer Orders
            </Badge>
            <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-200">
              <Wrench className="h-3 w-3 mr-1" />
              Repairs Due
            </Badge>
            <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-200">
              Completed
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-6">
        <div className="w-full max-w-full overflow-hidden rounded-md">
          {isLoading ? (
            <div className="rounded border p-2 w-full min-h-[320px] bg-muted/50 flex items-center justify-center text-sm text-muted-foreground">
              Loading calendar events...
            </div>
          ) : (
            <FullCalendar
              plugins={[dayGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              height="auto"
              aspectRatio={1.8}
              contentHeight="auto"
              events={calendarEvents}
              eventDisplay="block"
              editable={true}
              droppable={true}
              eventClick={handleEventClick}
              eventDrop={handleEventDrop}
              eventMouseEnter={handleEventMouseEnter}
              eventMouseLeave={handleEventMouseLeave}
              eventTimeFormat={{
                hour: 'numeric',
                minute: '2-digit',
                meridiem: 'short'
              }}
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,dayGridWeek'
              }}
              eventDidMount={(info) => {
                info.el.style.cursor = 'pointer';
              }}
            />
          )}
        </div>

        {/* Hover Tooltip */}
        {hoveredEvent && !selectedEvent && (
          <div
            className="fixed z-50 pointer-events-none animate-in fade-in-0 zoom-in-95 duration-100"
            style={{
              left: Math.min(Math.max(hoveredEvent.position.x - 120, 10), window.innerWidth - 260),
              top: hoveredEvent.position.y - 8,
              transform: 'translateY(-100%)',
            }}
          >
            <div className="bg-popover border rounded-lg shadow-md p-3 w-[240px]">
              <div className="flex items-center gap-2 mb-2">
                {getEventIcon(hoveredEvent.type)}
                <span className="text-xs font-semibold text-foreground">
                  {hoveredEvent.eventNumber}
                </span>
                {getStatusBadge(hoveredEvent.status, hoveredEvent.type)}
              </div>
              <p className="text-sm font-medium truncate">{hoveredEvent.title}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(hoveredEvent.date).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric'
                })}
              </p>
              <p className="text-xs text-muted-foreground mt-2 italic">
                Click for details • Drag to reschedule
              </p>
            </div>
          </div>
        )}

        {/* Click Popover */}
        {selectedEvent && (
          <div
            className="fixed z-50 animate-in fade-in-0 zoom-in-95"
            style={{
              left: Math.min(selectedEvent.position.x - 150, window.innerWidth - 320),
              top: selectedEvent.position.y - 10,
              transform: 'translateY(-100%)',
            }}
          >
            <div className="bg-popover border rounded-lg shadow-lg p-4 w-[300px]">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  {getEventIcon(selectedEvent.type)}
                  <span className="font-semibold text-sm">
                    {selectedEvent.eventNumber}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={closePopover}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-2 text-sm">
                <p className="font-medium truncate" title={selectedEvent.title}>
                  {selectedEvent.title}
                </p>
                
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CalendarIcon className="h-3.5 w-3.5" />
                  <span>{new Date(selectedEvent.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Status:</span>
                  {getStatusBadge(selectedEvent.status, selectedEvent.type)}
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    window.location.href = getViewLink(selectedEvent.type);
                    closePopover();
                  }}
                >
                  <ExternalLink className="h-3.5 w-3.5 mr-1" />
                  View Details
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Backdrop for click popover */}
        {selectedEvent && (
          <div
            className="fixed inset-0 z-40"
            onClick={closePopover}
          />
        )}
      </CardContent>
    </Card>
  )
}
