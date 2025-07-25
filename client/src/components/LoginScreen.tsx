import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import zebulonLogoPath from '@assets/Zed-ai-logo_1753441894358.png';
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
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4" style={{ backgroundColor: '#000000' }}>
      <Card className="w-full max-w-md border border-gray-800 rounded-2xl" style={{ backgroundColor: '#000000' }}>
        <CardHeader className="text-center pb-6">
          <div className="flex justify-center mb-2">
            <img 
              src={zebulonLogoPath} 
              alt="Zebulon Oracle Logo" 
              className="w-24 h-24 object-contain opacity-90"
            />
          </div>
          <CardTitle className="text-3xl font-extrabold mb-3 tracking-wide" style={{ 
            color: '#ffffff', 
            textShadow: '0 0 15px rgba(168, 85, 247, 0.4), 0 0 30px rgba(168, 85, 247, 0.2)',
            background: 'linear-gradient(135deg, #ffffff 0%, #a855f7 50%, #ffffff 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            ZEBULON
          </CardTitle>
          <p className="text-gray-200 text-base font-medium" style={{ color: '#e5e7eb' }}>
            {isSignUp ? 'Create your account' : 'Welcome back'}
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
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Enter your username"
                className="border-gray-800 text-white rounded-lg focus:border-purple-500 focus:ring-purple-500"
                style={{ backgroundColor: '#000000' }}
                disabled={isLoading}
                required
              />
            </div>

            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="email">Email (Optional)</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email"
                  className="border-gray-800 text-white rounded-lg focus:border-purple-500 focus:ring-purple-500"
                  style={{ backgroundColor: '#000000' }}
                  disabled={isLoading}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter your password"
                  className="border-gray-800 text-white rounded-lg pr-10 focus:border-purple-500 focus:ring-purple-500"
                  style={{ backgroundColor: '#000000' }}
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
              className="w-full text-white font-medium rounded-lg hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#a855f7' }}
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
              className="hover:opacity-80 transition-opacity"
              style={{ color: '#a855f7' }}
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

          <div className="text-center text-xs text-gray-500 mt-4">
            <p>Zebulon AI System v1.0</p>
            <p>Local Processing • Secure • Private</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginScreen;