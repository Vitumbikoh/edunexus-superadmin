import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Server, 
  Database, 
  Activity, 
  HardDrive, 
  Cpu, 
  Monitor,
  AlertTriangle, 
  CheckCircle, 
  Clock,
  RefreshCw
} from "lucide-react";
import { useEffect, useState, useCallback } from 'react';
import { API_BASE } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

const System = () => {
  const [overview, setOverview] = useState<any>(null);
  const [resources, setResources] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const fetchJSON = useCallback(async (path: string) => {
    const res = await fetch(`${API_BASE}${path}`, { headers: { 'Authorization': `Bearer ${token}` }});
    if (!res.ok) throw new Error(`Failed ${path}`);
    return res.json();
  }, [token]);

  const loadData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [ov, rs, sv] = await Promise.all([
        fetchJSON('/system/overview'),
        fetchJSON('/system/resources'),
        fetchJSON('/system/services')
      ]);
      setOverview(ov);
      setResources(rs);
      setServices(sv);
    } catch (e) {
      console.error('Failed loading system data', e);
    } finally {
      setLoading(false);
    }
  }, [fetchJSON, token]);

  useEffect(() => { loadData(); }, [loadData]);

  const refresh = async () => { setRefreshing(true); try { await loadData(); } finally { setRefreshing(false); } };
  const formatPercent = (v?: number) => v === undefined ? '0%' : `${Number(v).toFixed(1)}%`;
  const healthy = overview?.status === 'HEALTHY';

  return (
    <AdminLayout title="System" subtitle="System configuration and maintenance">
      <div className="space-y-6">
        <div className="flex justify-end">
          <Button size="sm" variant="outline" onClick={refresh} disabled={refreshing}>{refreshing ? 'Refreshing...' : 'Refresh'}</Button>
        </div>
        {/* System Health Overview */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Status</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading && !overview ? <Skeleton className="h-6 w-24" /> : (
                <div className="flex items-center space-x-2">
                  {healthy ? <CheckCircle className="h-5 w-5 text-green-600" /> : <AlertTriangle className="h-5 w-5 text-yellow-600" />}
                  <span className={`text-lg font-semibold ${healthy ? 'text-green-600' : 'text-yellow-600'}`}>{healthy ? 'Healthy' : 'Degraded'}</span>
                </div>
              )}
              <p className="text-xs text-muted-foreground">{overview?.statusMessage || 'Checking...'}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Uptime</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview ? formatPercent(overview.uptime30DayPercent) : <Skeleton className="h-8 w-16" />}</div>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview ? overview.activeSessions?.toLocaleString() : <Skeleton className="h-8 w-16" />}</div>
              <p className="text-xs text-muted-foreground">Current users online</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{overview ? overview.alerts : <Skeleton className="h-8 w-10" />}</div>
              <p className="text-xs text-muted-foreground">Warnings to review</p>
            </CardContent>
          </Card>
        </div>

  <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Server Resources</CardTitle>
                  <CardDescription>Current resource utilization</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        <Cpu className="h-4 w-4" />
                        <span>CPU Usage</span>
                      </div>
                      <span>{resources ? formatPercent(resources.cpu?.percent) : '...'}</span>
                    </div>
                    <Progress value={resources?.cpu?.percent || 0} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        <Monitor className="h-4 w-4" />
                        <span>Memory Usage</span>
                      </div>
                      <span>{resources ? formatPercent(resources.memory?.percent) : '...'}</span>
                    </div>
                    <Progress value={resources?.memory?.percent || 0} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        <HardDrive className="h-4 w-4" />
                        <span>Disk Usage</span>
                      </div>
                      <span>{resources ? formatPercent(resources.disk?.percent) : '...'}</span>
                    </div>
                    <Progress value={resources?.disk?.percent || 0} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        <Database className="h-4 w-4" />
                        <span>Database Load</span>
                      </div>
                      <span>{resources ? formatPercent(resources.database?.percent) : '...'}</span>
                    </div>
                    <Progress value={resources?.database?.percent || 0} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Service Status</CardTitle>
                  <CardDescription>Current status of system services</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {loading && services.length === 0 && <Skeleton className="h-32 w-full" />}
                  {services.map(s => {
                    const color = s.status === 'RUNNING' ? 'bg-green-100 text-green-800' : s.status === 'WARNING' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800';
                    return (
                      <div key={s.name} className="flex items-center justify-between">
                        <span className="text-sm">{s.name}</span>
                        <Badge className={color}>{s.status === 'RUNNING' ? 'Running' : s.status === 'WARNING' ? 'Warning' : 'Down'}</Badge>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>
  </div>
      </div>
    </AdminLayout>
  );
};

export default System;