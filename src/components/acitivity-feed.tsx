import { Card, CardHeader, CardTitle, CardContent } from "@/src/components/ui/card"

type ActivityItem = {
  title: string
  desc: string
  time: string
}

type ActivityFeedProps = {
  title?: string
  activity: ActivityItem[]
}

export function ActivityFeed({ title = "Recent Activity", activity }: ActivityFeedProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activity.map((item, i) => (
          <div key={i} className="flex justify-between">
            <div>
              <p className="font-medium text-sm">{item.title}</p>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
            <span className="text-xs text-muted-foreground">{item.time}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
