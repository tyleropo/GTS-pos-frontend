'use client'

import { Card, CardHeader, CardTitle, CardContent } from "@/src/components/ui/card"
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'

export default function Calendar() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Sales Overview</CardTitle>
      </CardHeader>
      <CardContent className="px-6">
        <div className="w-full max-w-full overflow-hidden rounded-md">
          <FullCalendar
            plugins={[dayGridPlugin]}
            initialView="dayGridMonth"
            height="auto"
            aspectRatio={1.8}
            contentHeight="auto"
          />
        </div>
      </CardContent>
    </Card>
  )
}
