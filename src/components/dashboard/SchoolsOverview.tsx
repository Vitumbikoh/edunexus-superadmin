import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MoreHorizontal, Eye, Pause, Play, RefreshCcw } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useSchools } from "@/hooks/useSchools";
import { activateSchool, suspendSchool } from "@/lib/utils";
import { useState } from "react";

const getStatusBadge = (status?: string) => {
  switch (status) {
    case "ACTIVE":
    case "active":
      return <Badge className="bg-success/10 text-success hover:bg-success/20">Active</Badge>;
    case "SUSPENDED":
    case "suspended":
      return <Badge className="bg-destructive/10 text-destructive hover:bg-destructive/20">Suspended</Badge>;
    case "PENDING":
    case "pending":
      return <Badge className="bg-warning/10 text-warning hover:bg-warning/20">Pending</Badge>;
    default:
      return <Badge variant="secondary">Unknown</Badge>;
  }
};

export function SchoolsOverview() {
  const { data: schools = [], isLoading, refetch } = useSchools();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const doSuspend = async (id: string) => {
    if (!confirm('Suspend this school?')) return;
    setActionLoading(id);
    try {
      await suspendSchool(id);
      await refetch();
    } catch (e: any) {
      alert(e?.message || 'Failed to suspend');
    } finally {
      setActionLoading(null);
    }
  };

  const doActivate = async (id: string) => {
    if (!confirm('Activate this school?')) return;
    setActionLoading(id);
    try {
      await activateSchool(id);
      await refetch();
    } catch (e: any) {
      alert(e?.message || 'Failed to activate');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Schools Overview</CardTitle>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCcw className="h-3 w-3 mr-1" /> Refresh
          </Button>
          <Button size="sm">View All Schools</Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-8 text-sm text-muted-foreground text-center">Loading schools...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>School</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schools.slice(0,6).map((school: any) => (
                <TableRow key={school.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{school.name}</div>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(school.status)}</TableCell>
                  <TableCell className="font-mono text-xs">{school.code}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {school.createdAt ? new Date(school.createdAt).toLocaleDateString() : '-'}
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
                        {['ACTIVE','active'].includes(school.status) ? (
                          <DropdownMenuItem className="text-warning" disabled={actionLoading===school.id} onClick={() => doSuspend(school.id)}>
                            <Pause className="mr-2 h-4 w-4" />
                            {actionLoading===school.id ? '...' : 'Suspend'}
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem className="text-success" disabled={actionLoading===school.id} onClick={() => doActivate(school.id)}>
                            <Play className="mr-2 h-4 w-4" />
                            {actionLoading===school.id ? '...' : 'Activate'}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}