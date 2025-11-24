import { API_BASE } from "@/lib/utils";

export interface SystemOverview {
  status: string;
  statusMessage: string;
  uptimeSeconds: number;
  uptime30DayPercent: number;
  activeSessions: number;
  alerts: number;
  generatedAt: string;
}

export interface ResourceUsage {
  cpu: { percent: number };
  memory: { percent: number; used: number; total: number };
  disk: { percent: number };
  database: { percent: number };
  generatedAt: string;
}

export interface ServiceStatus {
  name: string;
  status: 'RUNNING' | 'WARNING' | 'DOWN';
  message?: string;
  uptime?: string;
  lastChecked?: string;
}

export interface SystemMetrics {
  overview: SystemOverview | null;
  resources: ResourceUsage | null;
  services: ServiceStatus[] | null;
  totalRequests?: number;
  responseTime?: number;
}

class SystemService {
  private async request(endpoint: string) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${endpoint}: ${response.statusText}`);
    }

    return response.json();
  }

  async getSystemOverview(): Promise<SystemOverview> {
    return this.request('/system/overview');
  }

  async getResourceUsage(): Promise<ResourceUsage> {
    return this.request('/system/resources');
  }

  async getServicesStatus(): Promise<ServiceStatus[]> {
    return this.request('/system/services');
  }

  async getCompleteSystemMetrics(): Promise<SystemMetrics> {
    try {
      const [overview, resources, services] = await Promise.allSettled([
        this.getSystemOverview(),
        this.getResourceUsage(),
        this.getServicesStatus()
      ]);

      return {
        overview: overview.status === 'fulfilled' ? overview.value : null,
        resources: resources.status === 'fulfilled' ? resources.value : null,
        services: services.status === 'fulfilled' ? services.value : null,
        // These could be calculated from other data or come from additional endpoints
        totalRequests: Math.floor(8000 + Math.random() * 1000), // Simulated for now
        responseTime: Math.floor(200 + Math.random() * 100) // Simulated for now
      };
    } catch (error) {
      console.error('Failed to fetch system metrics:', error);
      // Return fallback data structure
      return {
        overview: null,
        resources: null,
        services: null,
        totalRequests: 0,
        responseTime: 0
      };
    }
  }

  formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) {
      return `${days} days, ${hours} hours`;
    } else if (hours > 0) {
      return `${hours} hours, ${minutes} minutes`;
    } else {
      return `${minutes} minutes`;
    }
  }

  getStatusIcon(status: string) {
    switch (status.toUpperCase()) {
      case 'HEALTHY':
      case 'RUNNING':
        return { color: 'text-green-500', variant: 'default' as const };
      case 'WARNING':
        return { color: 'text-yellow-500', variant: 'secondary' as const };
      case 'CRITICAL':
      case 'DOWN':
      case 'ERROR':
        return { color: 'text-red-500', variant: 'destructive' as const };
      default:
        return { color: 'text-gray-500', variant: 'outline' as const };
    }
  }

  getMetricStatus(value: number, threshold: number): 'healthy' | 'warning' | 'critical' {
    if (value < threshold * 0.7) return 'healthy';
    if (value < threshold * 0.9) return 'warning';
    return 'critical';
  }
}

export const systemService = new SystemService();