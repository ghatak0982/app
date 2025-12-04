import { useState, useContext, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { AuthContext, API } from '@/App';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Trash2, Calendar, Shield, FileText, Wrench } from 'lucide-react';
import { toast } from 'sonner';
import { format, differenceInDays } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function VehicleDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadVehicle();
  }, [id]);

  const loadVehicle = async () => {
    try {
      const response = await axios.get(`${API}/vehicles/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVehicle(response.data);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load vehicle details');
      navigate('/vehicles');
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await axios.delete(`${API}/vehicles/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Vehicle deleted successfully');
      navigate('/vehicles');
    } catch (error) {
      toast.error('Failed to delete vehicle');
      setDeleting(false);
    }
  };

  const getExpiryStatus = (expiryDate) => {
    if (!expiryDate) return { variant: 'secondary', label: 'Unknown', color: 'text-muted-foreground' };
    
    const now = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = differenceInDays(expiry, now);

    if (daysUntilExpiry < 0) {
      return { variant: 'destructive', label: 'Expired', color: 'text-destructive' };
    } else if (daysUntilExpiry <= 15) {
      return { variant: 'warning', label: `Expires in ${daysUntilExpiry} days`, color: 'text-warning' };
    } else {
      return { variant: 'success', label: 'Valid', color: 'text-accent' };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const documents = [
    {
      icon: Calendar,
      label: 'Road Tax',
      expiry: vehicle.road_tax_expiry,
      status: getExpiryStatus(vehicle.road_tax_expiry)
    },
    {
      icon: Shield,
      label: 'Insurance',
      expiry: vehicle.insurance_expiry,
      status: getExpiryStatus(vehicle.insurance_expiry)
    },
    {
      icon: FileText,
      label: 'PUC Certificate',
      expiry: vehicle.puc_expiry,
      status: getExpiryStatus(vehicle.puc_expiry)
    },
    {
      icon: Wrench,
      label: 'Fitness Certificate',
      expiry: vehicle.fitness_expiry,
      status: getExpiryStatus(vehicle.fitness_expiry)
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
      data-testid="vehicle-details-page"
    >
      <Button
        variant="ghost"
        onClick={() => navigate('/vehicles')}
        className="mb-6 gap-2"
        data-testid="back-to-vehicles-button"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Vehicles
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-white rounded-2xl shadow-neu border-none">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-3xl font-poppins font-semibold">
                    {vehicle.registration_number}
                  </CardTitle>
                  <p className="text-lg text-muted-foreground mt-2">
                    {vehicle.manufacturer} {vehicle.model} ({vehicle.year})
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="icon"
                      data-testid="delete-vehicle-button"
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Vehicle</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete {vehicle.registration_number}? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        disabled={deleting}
                        className="bg-destructive text-destructive-foreground"
                      >
                        {deleting ? 'Deleting...' : 'Delete'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Vehicle Type</p>
                  <p className="font-medium">{vehicle.vehicle_type}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Owner Name</p>
                  <p className="font-medium">{vehicle.owner_name || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h2 className="text-2xl font-poppins font-semibold">Document Status</h2>
            {documents.map((doc, idx) => {
              const Icon = doc.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className="bg-white rounded-2xl shadow-neu border-none hover:shadow-neu-hover transition-all">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-primary/10 rounded-xl">
                            <Icon className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{doc.label}</h3>
                            <p className="text-sm text-muted-foreground">
                              {doc.expiry ? format(new Date(doc.expiry), 'dd MMM yyyy') : 'Not available'}
                            </p>
                          </div>
                        </div>
                        <Badge variant={doc.status.variant} className="font-medium">
                          {doc.status.label}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-primary to-accent text-white rounded-2xl shadow-neu border-none">
            <CardHeader>
              <CardTitle className="text-white">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="secondary"
                className="w-full justify-start bg-white/20 hover:bg-white/30 text-white border-none"
                onClick={() => toast.info('Manual refresh feature coming soon')}
              >
                Refresh Data
              </Button>
              <Button
                variant="secondary"
                className="w-full justify-start bg-white/20 hover:bg-white/30 text-white border-none"
                onClick={() => toast.info('Download feature coming soon')}
              >
                Download Details
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white rounded-2xl shadow-neu border-none">
            <CardHeader>
              <CardTitle>Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground mb-1">Added on</p>
                <p className="font-medium">
                  {format(new Date(vehicle.created_at), 'dd MMM yyyy')}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Last updated</p>
                <p className="font-medium">
                  {format(new Date(vehicle.updated_at), 'dd MMM yyyy')}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
