import { Card, CardHeader, CardTitle, CardContent } from "@/src/components/ui/card"

type CalendarProps = {
  title?: string
  children?: React.ReactNode
}

export function Calendar({ title = "Sales Overview", children }: CalendarProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {children || (
          <div className="rounded border p-2 w-full min-h-[320px] bg-white text-center text-sm text-muted-foreground">
            [Calendar Placeholder]
          </div>
        )}
      </CardContent>
    </Card>
  )
}
