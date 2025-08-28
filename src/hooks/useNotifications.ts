import { useQuery } from '@tanstack/react-query';
import { getSchoolCredentials } from '@/lib/utils';

export interface Notification {
  id: string;
  schoolName: string;
  schoolCode: string;
  credentials?: any;
  createdAt: string;
  read?: boolean;
  type: 'credentials' | 'system' | 'alert';
  priority: 'low' | 'medium' | 'high';
}

async function fetchNotifications(): Promise<Notification[]> {
  const data = await getSchoolCredentials();
  
  // Transform the school credentials data into notification format
  if (Array.isArray(data)) {
    return data.map((item: any, index: number) => ({
      id: item.id || `notification-${index}`,
      schoolName: item.schoolName || item.name || 'Unknown School',
      schoolCode: item.schoolCode || item.code || 'N/A',
      credentials: item.credentials || item,
      createdAt: item.createdAt || new Date().toISOString(),
      read: false,
      type: 'credentials' as const,
      priority: 'medium' as const,
    }));
  }
  
  // Handle if data has a different structure
  return data?.notifications || data?.credentials || [];
}

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
    staleTime: 30_000, // Refresh every 30 seconds
    refetchInterval: 60_000, // Auto-refetch every minute
  });
}
