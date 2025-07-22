import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Eye, EyeOff, Settings, Key, User, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface AdminLoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoginSuccess: (admin: any) => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  open,
  onOpenChange,
  onLoginSuccess
}) => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState('login');
  
  // Credential management states
  const [newCredentials, setNewCredentials] = useState({ 
    currentPassword: '', 
    newUsername: '', 
    newPassword: '', 
    confirmPassword: '' 
  });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState('');
  const [updateError, setUpdateError] = useState('');
  
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: async (creds: typeof credentials) => {
      const response = await apiRequest('/api/admin/login', {
        method: 'POST',
        body: JSON.stringify(creds),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return response;
    },
    onSuccess: (data) => {
      if (data.success) {
        onLoginSuccess(data.admin);
        onOpenChange(false);
        setCredentials({ username: '', password: '' });
        setLoginError('');
      } else {
        setLoginError('Invalid credentials');
      }
    },
    onError: () => {
      setLoginError('Login failed. Please try again.');
    }
  });

  // Credential update mutation
  const updateCredentialsMutation = useMutation({
    mutationFn: async (updateData: typeof newCredentials) => {
      const response = await apiRequest('/api/admin/update-credentials', {
        method: 'POST',
        body: JSON.stringify(updateData),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return response;
    },
    onSuccess: (data) => {
      if (data.success) {
        setUpdateSuccess('Credentials updated successfully');
        setUpdateError('');
        setNewCredentials({ currentPassword: '', newUsername: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => setUpdateSuccess(''), 3000);
        queryClient.invalidateQueries({ queryKey: ['/api/admin'] });
      } else {
        setUpdateError(data.message || 'Failed to update credentials');
        setUpdateSuccess('');
      }
    },
    onError: () => {
      setUpdateError('Update failed. Please try again.');
      setUpdateSuccess('');
    }
  });

  const handleLogin = () => {
    if (!credentials.username.trim() || !credentials.password.trim()) {
      setLoginError('Please enter both username and password');
      return;
    }
    
    setLoginError('');
    loginMutation.mutate(credentials);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (activeTab === 'login') {
        handleLogin();
      } else {
        handleUpdateCredentials();
      }
    }
  };

  const handleUpdateCredentials = () => {
    setUpdateError('');
    setUpdateSuccess('');

    if (!newCredentials.currentPassword) {
      setUpdateError('Current password is required');
      return;
    }

    if (!newCredentials.newUsername && !newCredentials.newPassword) {
      setUpdateError('Please provide either a new username or password');
      return;
    }

    if (newCredentials.newPassword && newCredentials.newPassword !== newCredentials.confirmPassword) {
      setUpdateError('New passwords do not match');
      return;
    }

    updateCredentialsMutation.mutate(newCredentials);
  };

  const validatePassword = (password: string) => {
    const requirements = [
      { test: /.{8,}/, message: 'At least 8 characters' },
      { test: /[A-Z]/, message: 'One uppercase letter' },
      { test: /[a-z]/, message: 'One lowercase letter' },
      { test: /\d/, message: 'One number' },
      { test: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\?]/, message: 'One special character' }
    ];
    
    return requirements.map(req => ({
      ...req,
      valid: req.test.test(password)
    }));
  };

  const passwordRequirements = validatePassword(newCredentials.newPassword);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-black bg-opacity-95 border border-orange-500/30 text-white max-w-md sm:max-w-lg lg:max-w-xl">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center space-x-2 sm:space-x-3">
            <div className="p-1.5 sm:p-2 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 rounded-lg zebulon-glow">
              <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-lg sm:text-xl font-bold zebulon-text-gradient block truncate">
                Zebulon Admin Access
              </span>
              <p className="text-xs sm:text-sm text-gray-400 font-normal truncate">
                Secure administrative controls
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-6">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-gray-300">Username</Label>
            <Input
              id="username"
              type="text"
              placeholder="Enter admin username"
              value={credentials.username}
              onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
              onKeyPress={handleKeyPress}
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-orange-400"
              autoComplete="username"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-300">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter admin password"
                value={credentials.password}
                onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                onKeyPress={handleKeyPress}
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-orange-400 pr-10"
                autoComplete="current-password"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </Button>
            </div>
          </div>

          {loginError && (
            <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              {loginError}
            </div>
          )}

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-sm text-blue-300">
            <p><strong>Default Admin Credentials:</strong></p>
            <p>Username: admin</p>
            <p>Password: zebulon2025</p>
          </div>
        </div>

        <div className="flex space-x-2 mt-6">
          <Button
            onClick={handleLogin}
            disabled={loginMutation.isPending}
            className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
          >
            {loginMutation.isPending ? 'Authenticating...' : 'Login'}
          </Button>
          <Button
            onClick={() => onOpenChange(false)}
            variant="ghost"
            className="flex-1 text-gray-400 hover:text-white hover:bg-white/10"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};