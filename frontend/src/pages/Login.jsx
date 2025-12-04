import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { AuthContext, API } from '@/App';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Truck, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { signInWithGoogle } from '@/lib/firebase';

export default function Login() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/auth/login`, data);
      login(response.data.access_token, response.data.user);
      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const googleUser = await signInWithGoogle();
      const response = await axios.post(`${API}/auth/google`, {
        id_token: googleUser.idToken,
        email: googleUser.email,
        name: googleUser.name,
        uid: googleUser.uid
      });
      login(response.data.access_token, response.data.user);
      toast.success('Signed in with Google!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || error.message || 'Google sign-in failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" data-testid="login-page">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/20 to-accent/10 relative overflow-hidden"
      >
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl"></div>
        </div>
        <div className="relative z-10 flex flex-col justify-center px-16 text-foreground">
          <div className="mb-8">
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="p-4 bg-primary rounded-2xl shadow-lg">
                <Truck className="w-12 h-12 text-white" />
              </div>
            </div>
          </div>
          <h2 className="text-5xl font-poppins font-semibold mb-4">Welcome to<br/>FleetCare</h2>
          <p className="text-xl text-muted-foreground leading-relaxed max-w-md">
            Warm Neutrals with<br/>a Single Accent
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ x: 50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background"
      >
        <div className="w-full max-w-md">
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="p-3 bg-primary rounded-xl">
              <Truck className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-poppins font-semibold text-foreground">FleetCare</h1>
          </div>

          <div className="bg-card rounded-3xl shadow-neu p-10 border border-border/20">
            <h2 className="text-3xl font-poppins font-semibold mb-2 text-foreground">Sign In</h2>
            <p className="text-muted-foreground mb-8">Email</p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-3">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="email"
                    data-testid="login-email-input"
                    type="email"
                    placeholder="Username"
                    className="pl-12 h-14 bg-card border-2 border-border rounded-xl text-foreground placeholder:text-muted-foreground/70 focus:border-primary transition-colors"
                    {...register('email', { required: 'Email is required' })}
                  />
                </div>
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
              </div>

              <div className="space-y-3">
                <Label htmlFor="password" className="text-foreground">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="password"
                    data-testid="login-password-input"
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    className="pl-12 pr-12 h-14 bg-card border-2 border-border rounded-xl text-foreground placeholder:text-muted-foreground/70 focus:border-primary transition-colors"
                    {...register('password', { required: 'Password is required' })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="remember"
                  className="w-4 h-4 rounded border-2 border-border accent-primary"
                />
                <Label htmlFor="remember" className="text-sm text-foreground cursor-pointer">
                  Remember me
                </Label>
              </div>

              <Button
                type="submit"
                data-testid="login-submit-button"
                className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-6 h-14 rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-[0.98] text-lg"
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-card text-muted-foreground">OR</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
                className="w-full mt-6 h-14 rounded-xl border-2 border-border hover:border-primary/50 hover:bg-card/80 transition-all font-medium text-foreground"
              >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {googleLoading ? 'Signing in...' : 'Continue with Google'}
              </Button>
            </div>

            <div className="mt-8 text-center">
              <Link to="/reset-password" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Forgot your password
              </Link>
            </div>
            
            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Link to="/signup" className="text-primary hover:underline font-semibold">
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
