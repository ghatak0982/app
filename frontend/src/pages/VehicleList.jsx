import { useState, useContext, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext, API } from '@/App';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Truck, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format, differenceInDays } from 'date-fns';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function VehicleList() {
  const { token } = useContext(AuthContext);
  const [vehicles, setVehicles] = useState([]);
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVehicles();
  }, []);

  useEffect(() => {
    if (search) {
      setFilteredVehicles(
        vehicles.filter(v => 
          v.registration_number.toLowerCase().includes(search.toLowerCase()) ||
          v.manufacturer.toLowerCase().includes(search.toLowerCase())
        )
      );
    } else {
      setFilteredVehicles(vehicles);
    }
  }, [search, vehicles]);

  const loadVehicles = async () => {
    try {
      const response = await axios.get(`${API}/vehicles`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVehicles(response.data);
      setFilteredVehicles(response.data);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load vehicles');
      setLoading(false);
    }
  };

  const getExpiryStatus = (expiryDate) => {
    if (!expiryDate) return { status: 'unknown', variant: 'secondary', label: 'Unknown' };
    
    const now = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = differenceInDays(expiry, now);

    if (daysUntilExpiry < 0) {
      return { status: 'expired', variant: 'destructive', label: 'Expired' };
    } else if (daysUntilExpiry <= 15) {
      return { status: 'expiring', variant: 'warning', label: `${daysUntilExpiry} days left` };
    } else {
      return { status: 'valid', variant: 'success', label: 'Valid' };
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
      data-testid="vehicle-list-page"
    >
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-poppins font-semibold tracking-tight mb-2">
            Your Vehicles
          </h1>
          <p className="text-muted-foreground">
            {vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''} in total
          </p>
        </div>
        <Link to="/add-vehicles">
          <Button className="bg-primary hover:bg-primary/90 text-white font-medium px-6 rounded-lg shadow-md">
            Add Vehicles
          </Button>
        </Link>
      </div>

      <motion.div variants={item} className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search by registration number or manufacturer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="vehicle-search-input"
            className="pl-10 bg-white shadow-neu border-none"
          />
        </div>
      </motion.div>

      {filteredVehicles.length === 0 ? (
        <motion.div variants={item}>
          <Card className="bg-white rounded-2xl shadow-neu border-none p-12 text-center">
            <Truck className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-poppins font-semibold mb-2">No vehicles found</h3>
            <p className="text-muted-foreground mb-6">
              {search ? 'Try adjusting your search criteria' : 'Start by adding your first vehicle'}
            </p>
            {!search && (
              <Link to="/add-vehicles">
                <Button className="bg-primary hover:bg-primary/90 text-white">
                  Add Your First Vehicle
                </Button>
              </Link>
            )}
          </Card>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVehicles.map((vehicle) => {
            const roadTaxStatus = getExpiryStatus(vehicle.road_tax_expiry);
            const insuranceStatus = getExpiryStatus(vehicle.insurance_expiry);
            const pucStatus = getExpiryStatus(vehicle.puc_expiry);

            return (
              <motion.div key={vehicle.id} variants={item}>
                <Link to={`/vehicles/${vehicle.id}`}>
                  <Card
                    className="bg-white rounded-2xl shadow-neu border-none hover:shadow-neu-hover transition-all cursor-pointer group"
                    data-testid={`vehicle-card-${vehicle.registration_number}`}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-xl font-poppins font-semibold group-hover:text-primary transition-colors">
                            {vehicle.registration_number}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            {vehicle.manufacturer} {vehicle.model}
                          </p>
                        </div>
                        <Truck className="w-6 h-6 text-primary" />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Road Tax</span>
                        <Badge
                          variant={roadTaxStatus.variant}
                          className="font-medium"
                        >
                          {roadTaxStatus.label}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Insurance</span>
                        <Badge
                          variant={insuranceStatus.variant}
                          className="font-medium"
                        >
                          {insuranceStatus.label}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">PUC</span>
                        <Badge
                          variant={pucStatus.variant}
                          className="font-medium"
                        >
                          {pucStatus.label}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
