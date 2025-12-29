import { Card, CardHeader, CardTitle, CardContent } from "@/src/components/ui/card"
import { formatDistanceToNow } from "date-fns"

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
  const formatTime = (timeString: string) => {
    try {
      const date = new Date(timeString);
      if (isNaN(date.getTime())) return timeString;
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return timeString;
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activity.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-6 text-center text-muted-foreground h-[150px]">
            <p className="text-sm">No recent activity</p>
          </div>
        ) : (
          activity.map((item, i) => (
            <div key={i} className="flex justify-between gap-4">
              <div className="space-y-1">
                <p className="font-medium text-sm leading-none">{item.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-1">{item.desc}</p>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                {formatTime(item.time)}
              </span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
