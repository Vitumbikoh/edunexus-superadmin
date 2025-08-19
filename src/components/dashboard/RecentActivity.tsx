import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";

interface ActivityItem {
  id: string;
  action: string;
  user: string;
  school?: string;
  timestamp: Date;
  type: "create" | "update" | "delete" | "login" | "system";
}

const recentActivities: ActivityItem[] = [
  {
    id: "1",
    action: "Created new school",
    user: "John Smith",
    school: "Riverside High",
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
    type: "create"
  },
  {
    id: "2",
    action: "Updated user permissions",
    user: "Sarah Wilson",
    school: "Central Academy",
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    type: "update"
  },
  {
    id: "3",
    action: "School suspended",
    user: "Mike Johnson",
    school: "Oak Valley School",
    timestamp: new Date(Date.now() - 1000 * 60 * 45),
    type: "system"
  },
  {
    id: "4",
    action: "Admin login detected",
    user: "Emily Davis",
    school: "Pine Grove Elementary",
    timestamp: new Date(Date.now() - 1000 * 60 * 60),
    type: "login"
  },
  {
    id: "5",
    action: "Bulk user import completed",
    user: "David Brown",
    school: "Metro High School",
    timestamp: new Date(Date.now() - 1000 * 60 * 90),
    type: "system"
  }
];

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
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-80">
          <div className="space-y-4">
            {recentActivities.map((activity) => (
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
      </CardContent>
    </Card>
  );
}