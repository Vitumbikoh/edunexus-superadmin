import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { MoreHorizontal, Eye, Pause, Play } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface School {
  id: string;
  name: string;
  code: string;
  status: "active" | "suspended" | "pending";
  userCount: number;
  createdAt: Date;
  lastActivity: Date;
}

const schools: School[] = [
  {
    id: "1",
    name: "Riverside High School",
    code: "RHS001",
    status: "active",
    userCount: 1247,
    createdAt: new Date("2024-01-15"),
    lastActivity: new Date(Date.now() - 1000 * 60 * 30)
  },
  {
    id: "2",
    name: "Central Academy",
    code: "CA002",
    status: "active",
    userCount: 892,
    createdAt: new Date("2024-02-01"),
    lastActivity: new Date(Date.now() - 1000 * 60 * 60)
  },
  {
    id: "3",
    name: "Oak Valley School",
    code: "OVS003",
    status: "suspended",
    userCount: 567,
    createdAt: new Date("2023-11-20"),
    lastActivity: new Date(Date.now() - 1000 * 60 * 60 * 24)
  },
  {
    id: "4",
    name: "Pine Grove Elementary",
    code: "PGE004",
    status: "active",
    userCount: 342,
    createdAt: new Date("2024-03-10"),
    lastActivity: new Date(Date.now() - 1000 * 60 * 15)
  }
];

const getStatusBadge = (status: School["status"]) => {
  switch (status) {
    case "active":
      return <Badge className="bg-success/10 text-success hover:bg-success/20">Active</Badge>;
    case "suspended":
      return <Badge className="bg-destructive/10 text-destructive hover:bg-destructive/20">Suspended</Badge>;
    case "pending":
      return <Badge className="bg-warning/10 text-warning hover:bg-warning/20">Pending</Badge>;
    default:
      return <Badge variant="secondary">Unknown</Badge>;
  }
};

export function SchoolsOverview() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Schools Overview</CardTitle>
        <Button size="sm">View All Schools</Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>School</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Users</TableHead>
              <TableHead>Last Activity</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {schools.map((school) => (
              <TableRow key={school.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{school.name}</div>
                    <div className="text-sm text-muted-foreground">{school.code}</div>
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(school.status)}</TableCell>
                <TableCell className="font-medium">{school.userCount.toLocaleString()}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {school.lastActivity.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      {school.status === "active" ? (
                        <DropdownMenuItem className="text-warning">
                          <Pause className="mr-2 h-4 w-4" />
                          Suspend
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem className="text-success">
                          <Play className="mr-2 h-4 w-4" />
                          Activate
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}