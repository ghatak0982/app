import { useContext, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AuthContext, API } from '@/App';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function Dashboard() {
  const { token } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/dashboard/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
      setStats(res.data);
      setLoading(false);
    })
    .catch(() => {
      toast.error('Failed to load dashboard data');
      setLoading(false);
    });
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Vehicles',
      value: stats?.total_vehicles || 0,
      icon: Truck,
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    {
      title: 'Expiring This Month',
      value: stats?.expiring_this_month || 0,
      icon: Clock,
      color: 'text-warning',
      bgColor: 'bg-warning/10'
    },
    {
      title: 'Overdue Road Tax',
      value: stats?.overdue?.road_tax || 0,
      icon: AlertTriangle,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10'
    },
    {
      title: 'Overdue Insurance',
      value: stats?.overdue?.insurance || 0,
      icon: AlertTriangle,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10'
    },
    {
      title: 'Overdue PUC',
      value: stats?.overdue?.puc || 0,
      icon: AlertTriangle,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10'
    }
  ];

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      data-testid="dashboard-page"
      className="space-y-8"
    >
      <div>
        <h1 className="text-4xl md:text-5xl font-poppins font-semibold tracking-tight mb-2">
          Welcome Back!
        </h1>
        <p className="text-muted-foreground text-lg">Here's an overview of your fleet</p>
      </div>

      <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={idx}
              whileHover={{ y: -5 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <Card className="bg-white rounded-2xl shadow-neu border-none hover:shadow-neu-hover transition-all">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-poppins font-semibold">{stat.value}</div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      <motion.div variants={item}>
        <Card className="bg-white rounded-2xl shadow-neu border-none p-8">
          <div className="flex items-start gap-6">
            <div className="flex-shrink-0 p-4 bg-accent/10 rounded-xl">
              <CheckCircle className="w-8 h-8 text-accent" />
            </div>
            <div>
              <h3 className="text-xl font-poppins font-semibold mb-2">Your Fleet Status</h3>
              <p className="text-muted-foreground leading-relaxed">
                {stats?.total_vehicles === 0
                  ? "You haven't added any vehicles yet. Start by adding your first vehicle to track renewal dates."
                  : `You have ${stats?.total_vehicles} vehicle${stats?.total_vehicles !== 1 ? 's' : ''} in your fleet. ${stats?.expiring_this_month > 0 ? `${stats.expiring_this_month} renewal${stats.expiring_this_month !== 1 ? 's are' : ' is'} due within the next month.` : 'All renewals are up to date!'}`
                }
              </p>
            </div>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}
