import { Card, CardHeader, CardTitle, CardContent } from "@/src/components/ui/card"
import { Badge } from "@/src/components/ui/badge"
import { Wrench, CheckCircle2 } from "lucide-react"

type Repair = {
  id: string
  customer: string
  status?: string
}

type PendingRepairsProps = {
  repairs: Repair[]
}

export function PendingRepairs({ repairs }: PendingRepairsProps) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return "text-emerald-700 border-emerald-300 bg-emerald-100";
      case 'in_progress': return "text-blue-700 border-blue-300 bg-blue-100";
      case 'waiting_for_parts': return "text-amber-700 border-amber-300 bg-amber-100";
      case 'cancelled': return "text-red-700 border-red-300 bg-red-100";
      default: return "text-gray-700 border-gray-300 bg-gray-100";
    }
  };

  const getStatusLabel = (status: string) => {
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Pending Repairs</CardTitle>
          <Wrench className="h-4 w-4 text-purple-500" />
        </div>
      </CardHeader>
      <CardContent>
        {repairs.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-6 text-center text-muted-foreground h-[200px]">
             <CheckCircle2 className="h-10 w-10 text-emerald-500 mb-2 opacity-50" />
             <p className="text-sm font-medium text-emerald-600">All caught up!</p>
            <p className="text-xs">No pending repairs</p>
          </div>
        ) : (
          <div className="space-y-4">
            {repairs.map((item, i) => (
               <div key={i} className="flex justify-between items-center group">
                <div className="flex items-center gap-3">
                   <div className="bg-muted p-1.5 rounded-full">
                    <Wrench className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors" />
                   </div>
                  <div>
                    <p className="text-sm font-medium leading-none mb-1">Repair {item.id}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{item.customer}</p>
                  </div>
                </div>
                <Badge variant="outline" className={getStatusColor(item.status || 'pending')}>
                  {getStatusLabel(item.status || 'Pending')}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
