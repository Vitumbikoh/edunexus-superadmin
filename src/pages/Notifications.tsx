import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Bell, Clock, CheckCircle2, AlertCircle, School, Copy, X } from "lucide-react";
import { useNotifications, type Notification } from "@/hooks/useNotifications";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'low':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'credentials':
      return <School className="h-4 w-4" />;
    case 'alert':
      return <AlertCircle className="h-4 w-4" />;
    default:
      return <Bell className="h-4 w-4" />;
  }
};

const NotificationItem = ({ notification, onClick }: { notification: Notification; onClick: () => void }) => {
  return (
    <Card 
      className={`transition-all hover:shadow-md cursor-pointer ${notification.read ? 'opacity-60' : 'border-blue-200'}`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between space-x-4">
          <div className="flex items-start space-x-3 flex-1">
            <div className="flex-shrink-0 mt-1">
              {getTypeIcon(notification.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h4 className="text-sm font-medium truncate">
                  {notification.schoolName}
                </h4>
                <Badge variant="outline" className="text-xs">
                  {notification.schoolCode}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                School credentials notification - Click to view details
              </p>
              <div className="flex items-center space-x-2 mt-2">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {new Date(notification.createdAt).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={getPriorityColor(notification.priority)}>
              {notification.priority}
            </Badge>
            {!notification.read && (
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const NotificationDetailsModal = ({ 
  notification, 
  isOpen, 
  onClose 
}: { 
  notification: Notification | null; 
  isOpen: boolean; 
  onClose: () => void;
}) => {
  const { toast } = useToast();

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`,
        duration: 2000,
      });
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  if (!notification) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <School className="h-5 w-5" />
            <span>{notification.schoolName}</span>
          </DialogTitle>
          <div className="flex items-center space-x-2">
            <Badge variant="outline">{notification.schoolCode}</Badge>
            <Badge className={getPriorityColor(notification.priority)}>
              {notification.priority}
            </Badge>
          </div>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <div className="flex items-center space-x-2 mb-2">
              <Clock className="h-4 w-4" />
              <span>{new Date(notification.createdAt).toLocaleString()}</span>
            </div>
          </div>

          {notification.credentials && (
            <div className="space-y-3">
              <h4 className="font-medium text-sm">School Credentials</h4>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <label className="text-xs text-muted-foreground uppercase tracking-wide">Username</label>
                    <p className="font-mono text-sm">{notification.credentials.username}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(notification.credentials.username, 'Username')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <label className="text-xs text-muted-foreground uppercase tracking-wide">Email</label>
                    <p className="font-mono text-sm">{notification.credentials.email}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(notification.credentials.email, 'Email')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <label className="text-xs text-muted-foreground uppercase tracking-wide">Password</label>
                    <p className="font-mono text-sm">{notification.credentials.password}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(notification.credentials.password, 'Password')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex space-x-2 pt-3">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    const allCredentials = `Username: ${notification.credentials.username}\nEmail: ${notification.credentials.email}\nPassword: ${notification.credentials.password}`;
                    copyToClipboard(allCredentials, 'All credentials');
                  }}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy All
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const Notifications = () => {
  const { data: notifications = [], isLoading, error, refetch } = useNotifications();
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleNotificationClick = (notification: Notification) => {
    setSelectedNotification(notification);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedNotification(null);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <AdminLayout 
      title="Notifications" 
      subtitle={`${notifications.length} total notifications, ${unreadCount} unread`}
    >
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <Bell className="h-4 w-4 mr-2" />
              {isLoading ? 'Refreshing...' : 'Refresh'}
            </Button>
            {unreadCount > 0 && (
              <Button variant="outline" size="sm">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Mark All as Read
              </Button>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            Auto-refreshes every minute
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Notifications</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{notifications.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unread</CardTitle>
              <AlertCircle className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{unreadCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">School Credentials</CardTitle>
              <School className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {notifications.filter(n => n.type === 'credentials').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notifications List */}
        <Card>
          <CardHeader>
            <CardTitle>All Notifications</CardTitle>
            <CardDescription>
              Recent notifications from school credentials and system alerts
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-8 text-center text-muted-foreground">
                Loading notifications...
              </div>
            ) : error ? (
              <div className="py-8 text-center text-red-600">
                Failed to load notifications. Please try refreshing.
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No notifications found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <NotificationItem 
                    key={notification.id} 
                    notification={notification} 
                    onClick={() => handleNotificationClick(notification)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Notification Details Modal */}
      <NotificationDetailsModal
        notification={selectedNotification}
        isOpen={isModalOpen}
        onClose={closeModal}
      />
    </AdminLayout>
  );
};

export default Notifications;
