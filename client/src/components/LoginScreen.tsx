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

interface LoginScreenProps { onLoginSuccess: (user: any) => void; }

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ username: '', password: '', email: '' });
  const [error, setError] = useState('');

  const loginMutation = useMutation({
    mutationFn: (data: { username: string; password: string }) => apiRequest('/api/auth/login', 'POST', data),
    onSuccess: (user) => { setError(''); onLoginSuccess(user); },
    onError: (error: any) => setError(error.message || 'Login failed'),
  });

  const signUpMutation = useMutation({
    mutationFn: (data: { username: string; password: string; email?: string }) => apiRequest('/api/auth/signup', 'POST', data),
    onSuccess: (user) => { setError(''); onLoginSuccess(user); },
    onError: (error: any) => setError(error.message || 'Sign up failed'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!formData.username || !formData.password) { setError('Username and password are required'); return; }
    if (isSignUp) signUpMutation.mutate(formData);
    else loginMutation.mutate({ username: formData.username, password: formData.password });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((previous) => ({ ...previous, [e.target.name]: e.target.value }));
  };

  const isLoading = loginMutation.isPending || signUpMutation.isPending;

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md border border-gray-800 rounded-2xl bg-black">
        <CardHeader className="text-center pb-6">
          <div className="flex justify-center mb-2"><img src={zebulonLogoPath} alt="ZCOS" className="w-24 h-24 object-contain opacity-90" /></div>
          <CardTitle className="text-3xl font-extrabold mb-3 tracking-wide">ZCOS</CardTitle>
          <p className="text-gray-200 text-base font-medium">{isSignUp ? 'Create your account' : 'Welcome back'}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" name="username" type="text" value={formData.username} onChange={handleInputChange} placeholder="Enter your username" className="border-gray-800 text-white rounded-lg" disabled={isLoading} required />
            </div>
            {isSignUp && <div className="space-y-2"><Label htmlFor="email">Email (Optional)</Label><Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="Enter your email" className="border-gray-800 text-white rounded-lg" disabled={isLoading} /></div>}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input id="password" name="password" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={handleInputChange} placeholder="Enter your password" className="border-gray-800 text-white rounded-lg pr-10" disabled={isLoading} required />
                <Button type="button" variant="ghost" size="sm" className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white" onClick={() => setShowPassword(!showPassword)} disabled={isLoading}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button>
              </div>
            </div>
            <Button type="submit" className="w-full text-white font-medium rounded-lg bg-purple-600" disabled={isLoading}>{isLoading ? 'Working…' : <span className="flex items-center justify-center gap-2">{isSignUp ? <UserPlus className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}{isSignUp ? 'Create Account' : 'Sign In'}</span>}</Button>
          </form>
          <div className="text-center"><Button variant="ghost" className="text-purple-400" onClick={() => { setIsSignUp(!isSignUp); setError(''); }} disabled={isLoading}>{isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}</Button></div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginScreen;
