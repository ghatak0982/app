import { useState, useContext, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { AuthContext, API } from '@/App';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, Check, AlertCircle, Info } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const item = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0 }
};

export default function Notifications() {
  const { token } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const response = await axios.get(`${API}/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(response.data);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load notifications');
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await axios.patch(
        `${API}/notifications/${notificationId}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, is_read: true } : n
      ));
      toast.success('Notification marked as read');
    } catch (error) {
      toast.error('Failed to mark notification as read');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'road_tax':
      case 'insurance':
      case 'puc':
        return AlertCircle;
      default:
        return Info;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      data-testid="notifications-page"
    >
      <div className="mb-8">
        <h1 className="text-4xl font-poppins font-semibold tracking-tight mb-2">
          Notifications
        </h1>
        <p className="text-muted-foreground">
          {notifications.filter(n => !n.is_read).length} unread notification{notifications.filter(n => !n.is_read).length !== 1 ? 's' : ''}
        </p>
      </div>

      {notifications.length === 0 ? (
        <motion.div variants={item}>
          <Card className="bg-white rounded-2xl shadow-neu border-none p-12 text-center">
            <Bell className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-poppins font-semibold mb-2">No notifications yet</h3>
            <p className="text-muted-foreground">
              You'll receive notifications here when vehicle documents are due for renewal
            </p>
          </Card>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => {
            const Icon = getNotificationIcon(notification.notification_type);
            return (
              <motion.div key={notification.id} variants={item}>
                <Card
                  className={`bg-white rounded-2xl shadow-neu border-none hover:shadow-neu-hover transition-all ${
                    !notification.is_read ? 'border-l-4 border-l-primary' : ''
                  }`}
                  data-testid={`notification-${notification.id}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-xl ${
                        notification.notification_type === 'road_tax' ? 'bg-warning/10' :
                        notification.notification_type === 'insurance' ? 'bg-destructive/10' :
                        'bg-primary/10'
                      }`}>
                        <Icon className={`w-6 h-6 ${
                          notification.notification_type === 'road_tax' ? 'text-warning' :
                          notification.notification_type === 'insurance' ? 'text-destructive' :
                          'text-primary'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="font-semibold text-lg mb-1">
                              {notification.title}
                            </h3>
                            <p className="text-muted-foreground mb-2">
                              {notification.message}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(notification.created_at), 'dd MMM yyyy, h:mm a')}
                            </p>
                          </div>
                          {!notification.is_read && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => markAsRead(notification.id)}
                              className="gap-2"
                              data-testid={`mark-read-${notification.id}`}
                            >
                              <Check className="w-4 h-4" />
                              Mark as read
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
