import { motion } from 'framer-motion';
import { Truck } from 'lucide-react';

export default function Splash() {
  return (
    <motion.div
      data-testid="splash-screen"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="flex items-center gap-4"
      >
        <div className="p-4 bg-white rounded-2xl shadow-neu">
          <Truck className="w-16 h-16 text-primary" />
        </div>
      </motion.div>
      <motion.h1
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="mt-6 text-5xl font-poppins font-semibold text-foreground"
      >
        FleetCare
      </motion.h1>
      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.6 }}
        className="mt-2 text-muted-foreground"
      >
        Manage Your Fleet Smartly
      </motion.p>
    </motion.div>
  );
}
