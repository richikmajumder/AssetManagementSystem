import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { AlertCircle, Loader2, FlaskConical } from 'lucide-react';
import { initAPI } from '../lib/api';
import { toast } from 'sonner';

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
    <div 
      className="min-h-screen flex items-center justify-center p-4 bg-slate-50"
      style={{
        backgroundImage: 'url(https://images.unsplash.com/photo-1576669801838-1b1c52121e6a?crop=entropy&cs=srgb&fm=jpg&q=85&w=1920)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" />
      
      <div className="relative z-10 w-full max-w-md fade-in">
        <div className="flex items-center justify-center mb-8 gap-3">
          <div className="p-3 bg-blue-600 rounded-xl">
            <FlaskConical className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">IDEAL Lab</h1>
            <p className="text-slate-300 text-sm">Inventory Management System</p>
          </div>
        </div>

        <Card className="border-0 shadow-2xl">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-bold">Sign in</CardTitle>
            <CardDescription>
              Enter your credentials to access your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@iitk.ac.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11"
                  data-testid="login-email-input"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11"
                  data-testid="login-password-input"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 btn-press"
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

            <div className="mt-6 pt-6 border-t border-slate-200">
              <p className="text-xs text-slate-500 text-center mb-3">
                First time? Initialize the database with sample data
              </p>
              <Button
                variant="outline"
                className="w-full"
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
              <p className="text-xs text-slate-400 text-center mt-3">
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
