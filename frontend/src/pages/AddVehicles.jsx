import { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext, API } from '@/App';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AddVehicles() {
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, setValue } = useForm();

  const onSubmit = async (data) => {
    const regNumbers = data.registrationNumbers
      .split(/[\n,]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    if (regNumbers.length === 0) {
      toast.error('Please enter at least one registration number');
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        `${API}/vehicles/bulk`,
        { registration_numbers: regNumbers },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Successfully added ${regNumbers.length} vehicle${regNumbers.length > 1 ? 's' : ''}!`);
      navigate('/vehicles');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add vehicles');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      data-testid="add-vehicles-page"
      className="max-w-3xl mx-auto"
    >
      <div className="mb-8">
        <h1 className="text-4xl font-poppins font-semibold tracking-tight mb-2">
          Add Vehicles
        </h1>
        <p className="text-muted-foreground text-lg">
          Add multiple vehicles by entering their registration numbers
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-white rounded-2xl shadow-neu border-none p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="registrationNumbers" className="text-base font-medium">
                Registration Numbers
              </Label>
              <p className="text-sm text-muted-foreground">
                Enter one registration number per line or separate by commas
              </p>
              <Textarea
                id="registrationNumbers"
                data-testid="registration-numbers-input"
                placeholder="Example:\nMH12AB1234\nDL10XY5678\nKA09CD9012"
                className="min-h-[300px] font-mono text-base shadow-neu-inset border-none focus:shadow-neu"
                {...register('registrationNumbers')}
              />
            </div>

            <div className="flex gap-4">
              <Button
                type="submit"
                data-testid="add-vehicles-submit-button"
                className="flex-1 bg-primary hover:bg-primary/90 text-white font-medium py-6 rounded-lg shadow-md hover:shadow-lg transition-all active:scale-95"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Adding Vehicles...
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5 mr-2" />
                    Add Vehicles
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="px-8"
                onClick={() => navigate('/vehicles')}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>

          <div className="mt-8 p-4 bg-primary/5 rounded-xl">
            <h3 className="font-semibold mb-2">How it works:</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>1. Enter vehicle registration numbers</li>
              <li>2. System automatically fetches vehicle details</li>
              <li>3. Tracks road tax, insurance, PUC, and fitness expiry dates</li>
              <li>4. Sends timely reminders before expiry</li>
            </ul>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}
