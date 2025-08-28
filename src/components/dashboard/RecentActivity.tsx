import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useRecentActivity, type ActivityItem } from "@/hooks/useRecentActivity";

const getActionBadgeVariant = (type: ActivityItem["type"]) => {
  switch (type) {
    case "create":
      return "bg-success/10 text-success hover:bg-success/20";
    case "update":
      return "bg-primary/10 text-primary hover:bg-primary/20";
    case "delete":
      return "bg-destructive/10 text-destructive hover:bg-destructive/20";
    case "login":
      return "bg-warning/10 text-warning hover:bg-warning/20";
    case "system":
      return "bg-muted text-muted-foreground hover:bg-muted/80";
    default:
      return "secondary";
  }
};

export function RecentActivity() {
  const { data: activities = [], isLoading, error } = useRecentActivity();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-6 w-16" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="py-8 text-center text-muted-foreground">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
            <p>Failed to load recent activity</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <p>No recent activity found</p>
          </div>
        ) : (
          <ScrollArea className="h-80">
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <Badge 
                    variant="secondary" 
                    className={getActionBadgeVariant(activity.type)}
                  >
                    {activity.type}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{activity.action}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>by {activity.user}</span>
                      {activity.school && (
                        <>
                          <span>•</span>
                          <span>{activity.school}</span>
                        </>
                      )}
                      <span>•</span>
                      <span>{formatDistanceToNow(activity.timestamp, { addSuffix: true })}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}