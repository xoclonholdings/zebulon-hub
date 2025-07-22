import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Shield, Lock, Eye, EyeOff, AlertTriangle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const { toast } = useToast();

  const handleLogin = async () => {
    if (!username || !password) {
      toast({
        title: "Authentication Required",
        description: "Please enter both username and password",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      // Default admin credentials: admin/zebulon2025
      if (username === 'admin' && password === 'zebulon2025') {
        toast({
          title: "Admin Access Granted",
          description: "Welcome to Zebulon Admin Control System",
          variant: "default"
        });
        
        // Store admin session
        localStorage.setItem('zebulon_admin_session', 'authenticated');
        localStorage.setItem('zebulon_admin_login_time', Date.now().toString());
        
        onSuccess();
        onClose();
        
        // Reset form
        setUsername('');
        setPassword('');
        setLoginAttempts(0);
      } else {
        setLoginAttempts(prev => prev + 1);
        
        toast({
          title: "Access Denied",
          description: `Invalid credentials. Attempts: ${loginAttempts + 1}/3`,
          variant: "destructive"
        });

        if (loginAttempts >= 2) {
          toast({
            title: "Security Alert",
            description: "Too many failed attempts. Contact system administrator.",
            variant: "destructive"
          });
          setTimeout(() => {
            onClose();
          }, 2000);
        }
      }
    } catch (error) {
      toast({
        title: "Authentication Error",
        description: "System authentication temporarily unavailable",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-black border border-white/20 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3 text-center">
            <div className="p-2 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                Zebulon Admin Access
              </h2>
              <p className="text-sm text-gray-400 mt-1">Secure Authentication Required</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Security Warning */}
          <div className="bg-red-500/10 border border-red-400/30 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <span className="text-red-300 text-sm font-medium">Administrator Access Only</span>
            </div>
            <p className="text-red-200 text-xs mt-1">
              Unauthorized access attempts are logged and monitored
            </p>
          </div>

          {/* Login Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-username" className="text-white">Administrator Username</Label>
              <div className="relative">
                <Input
                  id="admin-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter admin username"
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 pl-10"
                  disabled={isLoading}
                />
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-password" className="text-white">Password</Label>
              <div className="relative">
                <Input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter admin password"
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 pl-10 pr-10"
                  disabled={isLoading}
                />
                <Shield className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1 h-8 w-8 text-gray-400 hover:text-white"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>

          {/* Default Credentials Hint */}
          <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-blue-400" />
              <span className="text-blue-300 text-xs font-medium">Default Credentials</span>
            </div>
            <p className="text-blue-200 text-xs mt-1">
              Username: <code className="bg-blue-500/20 px-1 rounded">admin</code> | 
              Password: <code className="bg-blue-500/20 px-1 rounded">zebulon2025</code>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-white/10">
            <Button
              variant="outline"
              onClick={onClose}
              className="text-white border-white/30 hover:bg-white/10"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleLogin}
              disabled={isLoading || loginAttempts >= 3}
              className="bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-600 hover:to-orange-600"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4" />
                  <span>Admin Login</span>
                </div>
              )}
            </Button>
          </div>

          {/* Session Info */}
          <div className="text-center">
            <Badge variant="outline" className="text-xs text-gray-400 border-gray-600">
              Secure Session • 256-bit Encryption
            </Badge>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdminLoginModal;