import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { AlertCircle, Loader2 } from 'lucide-react';
import { initAPI } from '../lib/api';
import { toast } from 'sonner';

const LOGO_URL = "https://customer-assets.emergentagent.com/job_equipment-tracker-59/artifacts/hrjwe66k_Logo.png";

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const result = await login(email, password);
    
    if (result.success) {
      toast.success('Welcome back!');
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
    
    setIsLoading(false);
  };

  const handleInitialize = async () => {
    setIsInitializing(true);
    try {
      await initAPI.initialize();
      toast.success('Database initialized with sample data');
    } catch (err) {
      const msg = err.response?.data?.message || 'Initialization failed';
      toast.info(msg);
    } finally {
      setIsInitializing(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-black">
      <div className="w-full max-w-md fade-in">
        {/* Logo */}
        <div className="flex flex-col items-center justify-center mb-8">
          <img 
            src={LOGO_URL} 
            alt="IDEAL Lab Logo" 
            className="w-32 h-32 object-contain mb-4"
          />
          <h1 
            className="text-3xl font-black tracking-tight"
            style={{ 
              background: 'linear-gradient(135deg, #DAA520 0%, #FFD700 50%, #DAA520 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            IDEAL Lab
          </h1>
          <p className="text-slate-400 text-sm mt-1">Inventory Management System</p>
        </div>

        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-bold text-white">Sign in</CardTitle>
            <CardDescription className="text-slate-400">
              Enter your credentials to access your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 text-sm text-red-400 bg-red-900/30 border border-red-800 rounded-lg">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@iitk.ac.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-amber-500"
                  data-testid="login-email-input"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-amber-500"
                  data-testid="login-password-input"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-11 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black font-bold"
                disabled={isLoading}
                data-testid="login-submit-btn"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-800">
              <p className="text-xs text-slate-500 text-center mb-3">
                First time? Initialize the database with sample data
              </p>
              <Button
                variant="outline"
                className="w-full border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
                onClick={handleInitialize}
                disabled={isInitializing}
                data-testid="init-db-btn"
              >
                {isInitializing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Initializing...
                  </>
                ) : (
                  'Initialize Database'
                )}
              </Button>
              <p className="text-xs text-slate-500 text-center mt-3">
                Admin: admin@ideal.iitk.ac.in / admin
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
