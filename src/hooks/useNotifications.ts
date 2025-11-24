import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getNotifications, getNotificationStats, markNotificationAsRead, markAllNotificationsAsRead } from '@/lib/utils';

export interface Notification {
  id: string;
  title: string;
  message?: string;
  type: 'credentials' | 'system' | 'alert';
  priority: 'low' | 'medium' | 'high';
  read: boolean;
  metadata?: Record<string, any>;
  school?: {
    id: string;
    name: string;
    code: string;
  };
  schoolId?: string;
  createdAt: string;
  updatedAt: string;
  readAt?: string;
  // Backward compatibility properties
  schoolName?: string;
  schoolCode?: string;
  credentials?: any;
}

export interface NotificationStats {
  total: number;
  unread: number;
  read: number;
  byType: {
    credentials: number;
    system: number;
    alert: number;
  };
}

async function fetchNotifications(): Promise<Notification[]> {
  try {
    const response = await getNotifications(1, 100); // Get more notifications
    if (response.success && response.notifications) {
      // Transform the new API response to include backward compatibility
      return response.notifications.map((notification: any) => ({
        ...notification,
        schoolName: notification.school?.name || notification.metadata?.schoolName || 'Unknown School',
        schoolCode: notification.school?.code || notification.metadata?.schoolCode || 'N/A',
        credentials: notification.metadata?.credentials,
      }));
    }
    return [];
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    // Fallback to old API if new one fails
    return [];
  }
}

async function fetchNotificationStats(): Promise<NotificationStats> {
  try {
    const response = await getNotificationStats();
    if (response.success && response.stats) {
      return response.stats;
    }
    return {
      total: 0,
      unread: 0,
      read: 0,
      byType: { credentials: 0, system: 0, alert: 0 }
    };
  } catch (error) {
    console.error('Failed to fetch notification stats:', error);
    return {
      total: 0,
      unread: 0,
      read: 0,
      byType: { credentials: 0, system: 0, alert: 0 }
    };
  }
}

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
    staleTime: 30_000, // Refresh every 30 seconds
    refetchInterval: 60_000, // Auto-refetch every minute
  });
}

export function useNotificationStats() {
  return useQuery({
    queryKey: ['notification-stats'],
    queryFn: fetchNotificationStats,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      // Invalidate and refetch notifications and stats
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-stats'] });
    },
  });
}

export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      // Invalidate and refetch notifications and stats
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-stats'] });
    },
  });
}
