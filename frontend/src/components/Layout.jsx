import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '@/App';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Truck, 
  Plus, 
  Bell, 
  Settings, 
  LogOut,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const menuItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/vehicles', icon: Truck, label: 'Vehicles' },
  { path: '/add-vehicles', icon: Plus, label: 'Add Vehicles' },
  { path: '/notifications', icon: Bell, label: 'Notifications' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex" data-testid="app-layout">
      <motion.aside
        initial={{ x: -250 }}
        animate={{ x: 0 }}
        className="fixed left-0 top-0 h-full w-64 bg-white/80 backdrop-blur-xl border-r border-border z-50"
        style={{ boxShadow: '5px 0 20px rgba(0,0,0,0.05)' }}
      >
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-primary rounded-lg">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-poppins font-semibold">FleetCare</h1>
          </div>

          <nav className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
                >
                  <motion.div
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      isActive
                        ? 'bg-primary text-white shadow-md'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </motion.div>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-border bg-white/50">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="h-10 w-10 bg-primary">
              <AvatarFallback className="bg-primary text-white font-semibold">
                {user?.name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2"
            onClick={handleLogout}
            data-testid="logout-button"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </motion.aside>

      <div className="flex-1 ml-64">
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-border">
          <div className="flex items-center justify-between h-16 px-8">
            <h2 className="text-2xl font-poppins font-semibold capitalize">
              {location.pathname.split('/')[1] || 'Dashboard'}
            </h2>
            <div className="flex items-center gap-4">
              <Link to="/notifications">
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative"
                  data-testid="header-notifications-button"
                >
                  <Bell className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </header>

        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
