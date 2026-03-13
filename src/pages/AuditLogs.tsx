import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Download, Calendar, Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const mockAuditLogs = [
  {
    id: 1,
    timestamp: "2024-01-15 14:30:22",
    user: "john.smith@riverside.edu",
    action: "USER_LOGIN",
    resource: "Authentication System",
    school: "Riverside High School",
    ipAddress: "192.168.1.100",
    status: "SUCCESS",
    details: "User successfully logged in"
  },
  {
    id: 2,
    timestamp: "2024-01-15 14:25:15",
    user: "sarah.johnson@oakwood.edu",
    action: "STUDENT_UPDATE",
    resource: "Student: ID 1247",
    school: "Oakwood Elementary",
    ipAddress: "192.168.1.105",
    status: "SUCCESS",
    details: "Updated student grade information"
  },
  {
    id: 3,
    timestamp: "2024-01-15 14:20:08",
    user: "system@edunexus.com",
    action: "BACKUP_CREATED",
    resource: "Database Backup",
    school: "System",
    ipAddress: "10.0.0.1",
    status: "SUCCESS",
    details: "Automated daily backup completed"
  },
  {
    id: 4,
    timestamp: "2024-01-15 14:15:33",
    user: "mike.davis@central.edu",
    action: "LOGIN_FAILED",
    resource: "Authentication System",
    school: "Central Academy",
    ipAddress: "192.168.1.200",
    status: "FAILED",
    details: "Invalid password attempt"
  },
  {
    id: 5,
    timestamp: "2024-01-15 14:10:41",
    user: "admin@edunexus.com",
    action: "SCHOOL_SUSPENDED",
    resource: "School: Central Academy",
    school: "System",
    ipAddress: "10.0.0.5",
    status: "SUCCESS",
    details: "School suspended due to policy violation"
  }
];

const getActionColor = (action: string) => {
  switch (action) {
    case "USER_LOGIN":
      return "default";
    case "LOGIN_FAILED":
      return "destructive";
    case "STUDENT_UPDATE":
    case "BACKUP_CREATED":
      return "secondary";
    case "SCHOOL_SUSPENDED":
      return "destructive";
    default:
      return "secondary";
  }
};

const getStatusColor = (status: string) => {
  return status === "SUCCESS" ? "default" : "destructive";
};

const AuditLogs = () => {
  return (
    <AdminLayout title="Audit Logs" subtitle="System audit trails and activity logs">
      <div className="space-y-6">
        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24,756</div>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Failed Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">127</div>
              <p className="text-xs text-muted-foreground">Requires attention</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Security Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">45</div>
              <p className="text-xs text-muted-foreground">This week</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">System Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">892</div>
              <p className="text-xs text-muted-foreground">Automated actions</p>
            </CardContent>
          </Card>
        </div>

        {/* Audit Logs Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Audit Trail</CardTitle>
                <CardDescription>Complete log of all system activities</CardDescription>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
                <Button variant="outline" size="sm">
                  <Calendar className="mr-2 h-4 w-4" />
                  Date Range
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 mb-6">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search logs..." className="pl-8" />
              </div>
              <Select>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Action Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="login">Login Events</SelectItem>
                  <SelectItem value="data">Data Changes</SelectItem>
                  <SelectItem value="system">System Events</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>School</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>IP Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockAuditLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-xs">{log.timestamp}</TableCell>
                    <TableCell className="text-sm">{log.user}</TableCell>
                    <TableCell>
                      <Badge variant={getActionColor(log.action) as any}>
                        {log.action.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{log.resource}</TableCell>
                    <TableCell className="text-sm">{log.school}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(log.status) as any}>
                        {log.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{log.ipAddress}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AuditLogs;