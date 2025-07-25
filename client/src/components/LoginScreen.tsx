import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import zedLogoPath from '@assets/Zed-ai-logo_1753425830375.jpg';
import { Eye, EyeOff, LogIn, UserPlus } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface LoginScreenProps {
  onLoginSuccess: (user: any) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: ''
  });
  const [error, setError] = useState('');

  const loginMutation = useMutation({
    mutationFn: async (data: { username: string; password: string }) => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }
      return await response.json();
    },
    onSuccess: (user) => {
      setError('');
      onLoginSuccess(user);
    },
    onError: (error: any) => {
      setError(error.message || 'Login failed');
    }
  });

  const signUpMutation = useMutation({
    mutationFn: async (data: { username: string; password: string; email?: string }) => {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }
      return await response.json();
    },
    onSuccess: (user) => {
      setError('');
      onLoginSuccess(user);
    },
    onError: (error: any) => {
      setError(error.message || 'Sign up failed');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.username || !formData.password) {
      setError('Username and password are required');
      return;
    }

    if (isSignUp) {
      signUpMutation.mutate(formData);
    } else {
      loginMutation.mutate({
        username: formData.username,
        password: formData.password
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const isLoading = loginMutation.isPending || signUpMutation.isPending;

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      {/* Header with Logo */}
      <div className="absolute top-0 left-0 right-0 bg-gray-900 border-b border-blue-500/30 p-4 z-20">
        <div className="flex items-center justify-center">
          <div className="flex items-center space-x-3">
            <img 
              src={zedLogoPath} 
              alt="Zed AI Logo" 
              className="w-8 h-8 object-contain hover:scale-110 transition-transform"
            />
            <div className="text-center">
              <h1 className="text-xl font-bold text-blue-400">Zebulon AI System</h1>
              <p className="text-sm text-gray-400">Secure Authentication</p>
            </div>
          </div>
        </div>
      </div>

      <Card className="w-full max-w-md bg-gray-900 border border-blue-500/30 mt-20 z-10">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-blue-400">
            {isSignUp ? 'Create Account' : 'Sign In'}
          </CardTitle>
          <p className="text-gray-400 text-sm mt-2">
            {isSignUp ? 'Join the Zebulon AI ecosystem' : 'Access your AI assistant'}
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-gray-300">Username</Label>
              <Input
                id="username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Enter your username"
                className="bg-black border-blue-500/30 text-white focus:border-blue-400 focus:ring-blue-400/20 placeholder:text-gray-500"
                disabled={isLoading}
                required
              />
            </div>

            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300">Email (Optional)</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email"
                  className="bg-black border-blue-500/30 text-white focus:border-blue-400 focus:ring-blue-400/20 placeholder:text-gray-500"
                  disabled={isLoading}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter your password"
                  className="bg-black border-blue-500/30 text-white focus:border-blue-400 focus:ring-blue-400/20 placeholder:text-gray-500 pr-10"
                  disabled={isLoading}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>{isSignUp ? 'Creating Account...' : 'Signing In...'}</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  {isSignUp ? <UserPlus className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
                  <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
                </div>
              )}
            </Button>
          </form>

          <div className="text-center">
            <Button
              variant="ghost"
              className="text-blue-400 hover:text-blue-300"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
                setFormData({ username: '', password: '', email: '' });
              }}
              disabled={isLoading}
            >
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </Button>
          </div>

          <div className="text-center text-xs text-gray-500 mt-6 border-t border-blue-500/20 pt-4">
            <p className="font-mono">Zebulon AI System v1.0</p>
            <p className="text-blue-400/70 mt-1">Local Processing • Secure • Private</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginScreen;