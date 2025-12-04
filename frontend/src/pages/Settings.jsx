import { useState, useContext, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AuthContext, API } from '@/App';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { User, Bell, Shield, Clock } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

export default function Settings() {
  const { user, token } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [notificationDaysBefore, setNotificationDaysBefore] = useState(15);
  const [notificationTime, setNotificationTime] = useState('09:00');

  useEffect(() => {
    axios.get(`${API}/settings`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
      setEmailNotifications(res.data.email_notifications);
      setPushNotifications(res.data.push_notifications);
      setNotificationDaysBefore(res.data.notification_days_before);
      setNotificationTime(res.data.notification_time);
      setLoading(false);
    })
    .catch(() => {
      toast.error('Failed to load settings');
      setLoading(false);
    });
  }, [token]);

  const handleSavePreferences = async () => {
    setSaving(true);
    try {
      await axios.patch(`${API}/settings`, {
        email_notifications: emailNotifications,
        push_notifications: pushNotifications,
        notification_days_before: notificationDaysBefore,
        notification_time: notificationTime
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      data-testid="settings-page"
      className="max-w-4xl"
    >
      <div className="mb-8">
        <h1 className="text-4xl font-poppins font-semibold tracking-tight mb-2">
          Settings
        </h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      <div className="space-y-6">
        <Card className="bg-card rounded-2xl shadow-neu border border-border/20">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <User className="w-5 h-5 text-primary" />
              </div>
              <CardTitle className="text-foreground">Profile Information</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-foreground">Full Name</Label>
                <Input 
                  id="name" 
                  defaultValue={user?.name}
                  className="bg-card border-2 border-border rounded-xl h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  defaultValue={user?.email} 
                  disabled 
                  className="bg-muted border-2 border-border rounded-xl h-12 opacity-60"
                />
              </div>
            </div>
            <Button 
              onClick={() => toast.info('Profile update feature coming soon')} 
              className="bg-primary hover:bg-primary/90 text-white rounded-xl h-12 font-semibold shadow-lg"
            >
              Save Changes
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-card rounded-2xl shadow-neu border border-border/20">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/10 rounded-lg">
                <Bell className="w-5 h-5 text-accent" />
              </div>
              <CardTitle className="text-foreground">Notification Preferences</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-foreground">Email Notifications</h3>
                <p className="text-sm text-muted-foreground">
                  Receive email alerts for expiring documents
                </p>
              </div>
              <Switch
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
                data-testid="email-notifications-switch"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-foreground">Push Notifications</h3>
                <p className="text-sm text-muted-foreground">
                  Receive browser notifications
                </p>
              </div>
              <Switch
                checked={pushNotifications}
                onCheckedChange={setPushNotifications}
                data-testid="push-notifications-switch"
              />
            </div>

            <div className="space-y-4 pt-4 border-t border-border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-medium text-foreground">Notification Timing</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="days-before" className="text-foreground">Days Before Expiry</Label>
                  <Input
                    id="days-before"
                    type="number"
                    min="1"
                    max="90"
                    value={notificationDaysBefore}
                    onChange={(e) => setNotificationDaysBefore(parseInt(e.target.value))}
                    className="bg-card border-2 border-border rounded-xl"
                  />
                  <p className="text-xs text-muted-foreground">
                    Send notifications {notificationDaysBefore} days before expiry
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notification-time" className="text-foreground">Notification Time</Label>
                  <Input
                    id="notification-time"
                    type="time"
                    value={notificationTime}
                    onChange={(e) => setNotificationTime(e.target.value)}
                    className="bg-card border-2 border-border rounded-xl"
                  />
                  <p className="text-xs text-muted-foreground">
                    Preferred time for daily notifications
                  </p>
                </div>
              </div>
            </div>
            
            <Button 
              onClick={handleSavePreferences} 
              disabled={saving}
              className="bg-accent hover:bg-accent/90 text-white rounded-xl h-12 font-semibold shadow-lg"
            >
              {saving ? 'Saving...' : 'Save Preferences'}
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-card rounded-2xl shadow-neu border border-border/20">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-destructive/10 rounded-lg">
                <Shield className="w-5 h-5 text-destructive" />
              </div>
              <CardTitle className="text-foreground">Account Actions</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium mb-2 text-foreground">Change Password</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Update your password to keep your account secure
              </p>
              <Button 
                variant="outline" 
                onClick={() => toast.info('Password change feature coming soon')}
                className="border-2 border-border rounded-xl h-12"
              >
                Change Password
              </Button>
            </div>
            <div className="pt-4 border-t border-border">
              <h3 className="font-medium text-destructive mb-2">Danger Zone</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Permanently delete your account and all data
              </p>
              <Button 
                variant="destructive" 
                onClick={() => toast.info('Account deletion requires confirmation')}
                className="rounded-xl h-12"
              >
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
