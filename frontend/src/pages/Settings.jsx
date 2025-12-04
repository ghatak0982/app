import { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { AuthContext } from '@/App';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { User, Bell, Shield } from 'lucide-react';
import { toast } from 'sonner';

export default function Settings() {
  const { user } = useContext(AuthContext);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);

  const handleSave = () => {
    toast.success('Settings saved successfully');
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
        <Card className="bg-white rounded-2xl shadow-neu border-none">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <User className="w-5 h-5 text-primary" />
              </div>
              <CardTitle>Profile Information</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" defaultValue={user?.name} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue={user?.email} disabled />
              </div>
            </div>
            <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">
              Save Changes
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-2xl shadow-neu border-none">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/10 rounded-lg">
                <Bell className="w-5 h-5 text-accent" />
              </div>
              <CardTitle>Notification Preferences</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Email Notifications</h3>
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
                <h3 className="font-medium">Push Notifications</h3>
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
            <Button onClick={handleSave} className="bg-accent hover:bg-accent/90">
              Save Preferences
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-2xl shadow-neu border-none">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-destructive/10 rounded-lg">
                <Shield className="w-5 h-5 text-destructive" />
              </div>
              <CardTitle>Account Actions</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Change Password</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Update your password to keep your account secure
              </p>
              <Button variant="outline" onClick={() => toast.info('Password change feature coming soon')}>
                Change Password
              </Button>
            </div>
            <div className="pt-4 border-t">
              <h3 className="font-medium text-destructive mb-2">Danger Zone</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Permanently delete your account and all data
              </p>
              <Button variant="destructive" onClick={() => toast.info('Account deletion requires confirmation')}>
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
