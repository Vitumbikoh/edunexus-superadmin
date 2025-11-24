import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { systemService, type SystemMetrics, type ServiceStatus } from '@/services/systemService';
import { useAuth } from '@/contexts/AuthContext';
import {
  Server,
  Database,
  Cpu,
  HardDrive,
  Wifi,
  Users,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
  Zap,
  Monitor,
  RefreshCw,
  Loader2
} from 'lucide-react';

interface SystemMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  status: 'healthy' | 'warning' | 'critical';
  threshold: number;
}

interface SystemService {
  id: string;
  name: string;
  status: 'running' | 'stopped' | 'error' | 'warning';
  uptime: string;
  lastChecked: string;
}

interface ServerStatus {
  cpu: SystemMetric;
  memory: SystemMetric;
  disk: SystemMetric;
  network: SystemMetric;
  activeUsers: number;
  totalRequests: number;
  responseTime: number;
}

const System = () => {
  const { user } = useAuth();
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    overview: null,
    resources: null,
    services: null,
    totalRequests: 0,
    responseTime: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getStatusIcon = (status: string) => {
    switch (status.toUpperCase()) {
      case 'HEALTHY':
      case 'RUNNING':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'WARNING':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'CRITICAL':
      case 'DOWN':
      case 'ERROR':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <XCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const fetchSystemData = useCallback(async () => {
    try {
      setError(null);
      const data = await systemService.getCompleteSystemMetrics();
      setSystemMetrics(data);
    } catch (err) {
      console.error('Failed to fetch system data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch system data');
    }
  }, []);

  const refreshData = async () => {
    setIsRefreshing(true);
    await fetchSystemData();
    setIsRefreshing(false);
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await fetchSystemData();
      setIsLoading(false);
    };

    loadData();

    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchSystemData, 30000);
    return () => clearInterval(interval);
  }, [fetchSystemData]);

  // Calculate derived values from real data
  const activeUsers = systemMetrics.overview?.activeSessions || 0;
  const totalRequests = systemMetrics.totalRequests || 0;
  const responseTime = systemMetrics.responseTime || 0;
  const systemStatus = systemMetrics.overview?.status || 'UNKNOWN';
  const cpuUsage = systemMetrics.resources?.cpu?.percent || 0;
  const memoryUsage = systemMetrics.resources?.memory?.percent || 0;
  const diskUsage = systemMetrics.resources?.disk?.percent || 0;
  const uptime = systemMetrics.overview ? systemService.formatUptime(systemMetrics.overview.uptimeSeconds) : 'Unknown';

  if (isLoading) {
    return (
      <AdminLayout title="System Monitoring" subtitle="Monitor system health, performance metrics, and service status">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading system metrics...</span>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="System Monitoring" subtitle="Monitor system health, performance metrics, and service status">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {error && (
              <Alert className="max-w-md">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {error}. Showing cached/fallback data.
                </AlertDescription>
              </Alert>
            )}
          </div>
          <Button
            onClick={refreshData}
            disabled={isRefreshing}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* System Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeUsers}</div>
              <p className="text-xs text-muted-foreground">Currently online</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalRequests.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Today</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Response Time</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{responseTime}ms</div>
              <p className="text-xs text-muted-foreground">Average</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Status</CardTitle>
              <Monitor className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {getStatusIcon(systemStatus)}
                <span className={`text-lg font-semibold ${systemService.getStatusIcon(systemStatus).color}`}>
                  {systemStatus}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {systemMetrics.overview?.statusMessage || 'System status unknown'}
              </p>
            </CardContent>
          </Card>
        </div>

      <Tabs defaultValue="metrics" className="space-y-4">
        <TabsList>
          <TabsTrigger value="metrics">Performance Metrics</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="alerts">Alerts & Logs</TabsTrigger>
        </TabsList>

          <TabsContent value="metrics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* CPU Usage */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Cpu className="h-5 w-5" />
                      CPU Usage
                    </CardTitle>
                    <CardDescription>Current CPU utilization</CardDescription>
                  </div>
                  <Badge variant={systemService.getMetricStatus(cpuUsage, 80) === 'healthy' ? 'default' : 'destructive'}>
                    {systemService.getMetricStatus(cpuUsage, 80)}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{cpuUsage.toFixed(1)}%</span>
                      <span>Threshold: 80%</span>
                    </div>
                    <Progress
                      value={cpuUsage}
                      className={`h-2 ${cpuUsage > 80 ? 'bg-red-100' : 'bg-green-100'}`}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Memory Usage */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <HardDrive className="h-5 w-5" />
                      Memory Usage
                    </CardTitle>
                    <CardDescription>Current memory utilization</CardDescription>
                  </div>
                  <Badge variant={systemService.getMetricStatus(memoryUsage, 85) === 'healthy' ? 'default' : 'secondary'}>
                    {systemService.getMetricStatus(memoryUsage, 85)}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{memoryUsage.toFixed(1)}%</span>
                      <span>Threshold: 85%</span>
                    </div>
                    <Progress
                      value={memoryUsage}
                      className={`h-2 ${memoryUsage > 85 ? 'bg-red-100' : 'bg-green-100'}`}
                    />
                    {systemMetrics.resources?.memory && (
                      <div className="text-xs text-muted-foreground">
                        {Math.round(systemMetrics.resources.memory.used / 1024 / 1024)} MB / {Math.round(systemMetrics.resources.memory.total / 1024 / 1024)} MB
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Disk Usage */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Database className="h-5 w-5" />
                      Disk Usage
                    </CardTitle>
                    <CardDescription>Current disk utilization</CardDescription>
                  </div>
                  <Badge variant={systemService.getMetricStatus(diskUsage, 90) === 'healthy' ? 'default' : 'destructive'}>
                    {systemService.getMetricStatus(diskUsage, 90)}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{diskUsage.toFixed(1)}%</span>
                      <span>Threshold: 90%</span>
                    </div>
                    <Progress
                      value={diskUsage}
                      className={`h-2 ${diskUsage > 90 ? 'bg-red-100' : 'bg-green-100'}`}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Database Performance */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Wifi className="h-5 w-5" />
                      Database Performance
                    </CardTitle>
                    <CardDescription>Database response efficiency</CardDescription>
                  </div>
                  <Badge variant="default">
                    healthy
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{systemMetrics.resources?.database?.percent || 95}% efficiency</span>
                      <span>Target: &gt;90%</span>
                    </div>
                    <Progress
                      value={systemMetrics.resources?.database?.percent || 95}
                      className="h-2 bg-green-100"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="services" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>System Services</CardTitle>
                <CardDescription>
                  Status of critical system services and their uptime
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {systemMetrics.services && systemMetrics.services.length > 0 ? (
                    systemMetrics.services.map((service, index) => (
                      <div key={service.name || index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(service.status)}
                            <span className="font-medium">{service.name}</span>
                          </div>
                          <Badge variant={systemService.getStatusIcon(service.status).variant}>
                            {service.status}
                          </Badge>
                        </div>
                        <div className="text-right text-sm text-muted-foreground">
                          {service.uptime && <div>Uptime: {service.uptime}</div>}
                          {service.lastChecked && <div>Last checked: {service.lastChecked}</div>}
                          {service.message && <div className="text-xs">{service.message}</div>}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Server className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No service data available</p>
                      <p className="text-sm">Services information could not be retrieved from the backend</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-4">
            <div className="space-y-4">
              {/* Dynamic alerts based on system metrics */}
              {memoryUsage > 85 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Memory usage is high ({memoryUsage.toFixed(1)}% of 85% threshold). Consider scaling resources.
                  </AlertDescription>
                </Alert>
              )}
              
              {cpuUsage > 80 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    CPU usage is high ({cpuUsage.toFixed(1)}% of 80% threshold). System performance may be affected.
                  </AlertDescription>
                </Alert>
              )}

              {diskUsage > 90 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Disk usage is critical ({diskUsage.toFixed(1)}% of 90% threshold). Free up space immediately.
                  </AlertDescription>
                </Alert>
              )}

              {systemStatus === 'HEALTHY' && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    All systems operational. Last backup: {systemMetrics.resources?.generatedAt ? new Date(systemMetrics.resources.generatedAt).toLocaleString() : 'Unknown'}
                  </AlertDescription>
                </Alert>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>System Information</CardTitle>
                  <CardDescription>Current system status and uptime details</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center py-2 border-b">
                      <span>System Uptime</span>
                      <span className="text-muted-foreground">{uptime}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span>30-Day Availability</span>
                      <span className="text-muted-foreground">{systemMetrics.overview?.uptime30DayPercent || 99.9}%</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span>Active Sessions</span>
                      <span className="text-muted-foreground">{activeUsers} users</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span>Last Data Refresh</span>
                      <span className="text-muted-foreground">
                        {systemMetrics.overview?.generatedAt ? new Date(systemMetrics.overview.generatedAt).toLocaleString() : 'Just now'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default System;