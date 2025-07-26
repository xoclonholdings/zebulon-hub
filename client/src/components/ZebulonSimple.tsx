import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Send, Activity, LogOut, Settings, MessageCircle, Shield, DollarSign, Wrench, Lock, Database, FolderTree } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import zebulonLogoPath from '@assets/Zed-ai-logo_1753441894358.png';
import OracleDatabase from './OracleDatabase';
import ModuleSettings from './ModuleSettings';
import ModuleIntegrationComponent from './ModuleIntegration';
import GenealogyModule from './GenealogyModule';



interface SystemStatus {
  oracleCore?: {
    active: boolean;
    memory: number;
    queries: number;
    uptime: string;
    lastActivity: string;
    databaseConnections: number;
    responseTime: string;
  };
  zedCore?: {
    active: boolean;
    memory: number;
    tasks: number;
  };
}

interface ModuleIntegration {
  id: string;
  moduleName: string;
  displayName: string;
  isConnected: boolean;
  integrationType?: 'url' | 'script' | 'embed' | null;
  integrationUrl?: string | null;
  integrationScript?: string | null;
  integrationEmbed?: string | null;
  integrationConfig?: any;
  connectedAppName?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const ZebulonSimple: React.FC = () => {
  const { user, logout } = useAuth();
  const systemStatus: SystemStatus = {
    zedCore: {
      active: true,
      memory: 45,
      tasks: 3
    }
  };
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('');

  const [showConfigInterface, setShowConfigInterface] = useState(false);
  const [showOracleDatabase, setShowOracleDatabase] = useState(false);
  const [showGenealogyModule, setShowGenealogyModule] = useState(false);
  const [showModuleSettings, setShowModuleSettings] = useState<{show: boolean, moduleName: string, displayName: string}>({
    show: false,
    moduleName: '',
    displayName: ''
  });
  const [activeIntegration, setActiveIntegration] = useState<ModuleIntegration | null>(null);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const queryClient = useQueryClient();



  // Get all module integrations
  const { data: modulesData } = useQuery<ModuleIntegration[]>({
    queryKey: ['/api/modules'],
    enabled: !!user,
  });

  const moduleIntegrations = modulesData || [];



  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (passwordChange: { currentPassword: string; newPassword: string }) => {
      return await apiRequest('/api/auth/change-password', 'POST', passwordChange);
    },
    onSuccess: () => {
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast({
        title: "Password Changed",
        description: "Your password has been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to change password",
        variant: "destructive",
      });
    },
  });

  // Handle module click - check if integration exists
  const handleModuleClick = (moduleName: string, displayName: string) => {
    // Add visual feedback with toast notification
    toast({
      title: `${displayName} Clicked`,
      description: `Processing ${moduleName} module...`,
    });
    
    // Clear any existing states first
    setActiveTab('');
    setActiveIntegration(null);
    setShowModuleSettings({ show: false, moduleName: '', displayName: '' });
    setShowConfigInterface(false);
    setShowGenealogyModule(false);
    
    // Small delay to ensure state is cleared
    setTimeout(() => {
      if (moduleName === 'config') {
        // Config always opens internal settings as full-screen overlay
        setShowConfigInterface(true);
        toast({
          title: "Config Opened",
          description: "System settings panel loaded",
        });
        return;
      }

      if (moduleName === 'genealogy') {
        // Genealogy opens internal module directly
        setShowGenealogyModule(true);
        toast({
          title: "Legacy Archive Opened",
          description: "Genealogy module loaded",
        });
        return;
      }

      // ZED (chat) is also an external integration like other modules
      // Only CONFIG opens internal settings directly

      // Check if integration exists for this module
      const existingIntegration = moduleIntegrations.find(m => m.moduleName === moduleName);
      
      if (existingIntegration?.isConnected) {
        // Open the integrated app
        setActiveIntegration(existingIntegration);
        toast({
          title: "App Opened",
          description: `${displayName} integration loaded`,
        });
      } else {
        // Open settings to configure integration
        setShowModuleSettings({
          show: true,
          moduleName,
          displayName
        });
        toast({
          title: "Settings Opened",
          description: `Configure ${displayName} integration`,
        });
      }
    }, 100);
  };

  const handleIntegrationSave = (integration: ModuleIntegration) => {
    setShowModuleSettings({ show: false, moduleName: '', displayName: '' });
    // Optionally open the newly integrated app immediately
    setActiveIntegration(integration);
  };

;



  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error", 
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Error", 
        description: "New password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    changePasswordMutation.mutate({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword
    });
  };

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: '#000000' }}>
      {/* Header with Logo */}
      <header className="p-6 mb-6" style={{ backgroundColor: '#000000' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img 
              src={zebulonLogoPath} 
              alt="Zebulon Oracle Logo" 
              className="w-12 h-12 object-contain"
            />
            <div>
              <h1 className="text-2xl font-extrabold tracking-wide" style={{ 
                color: '#ffffff', 
                textShadow: '0 0 10px rgba(168, 85, 247, 0.3)',
                background: 'linear-gradient(135deg, #ffffff 0%, #a855f7 50%, #ffffff 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>ZEBULON</h1>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div 
              className="px-3 py-1 rounded-lg text-sm cursor-pointer hover:opacity-80 transition-opacity duration-200" 
              style={{ backgroundColor: '#1a1a1a', color: '#10b981' }}
              onClick={() => setShowOracleDatabase(true)}
            >
              Zebulon Core
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-gray-400 hover:text-white"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Interface Grid */}
      <div className="px-8 mb-8">
        {/* Primary Module Grid */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div 
            className="p-6 rounded-2xl cursor-pointer hover:opacity-80 transition-all duration-200 border border-gray-800" 
            style={{ backgroundColor: '#000000' }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleModuleClick('chat', 'ZED');
            }}
          >
            <div className="flex flex-col items-center space-y-3">
              <MessageCircle className="h-10 w-10 text-purple-400" />
              <span className="text-white font-bold text-lg">ZED</span>
              <span className="text-gray-400 text-sm text-center">Chat Interface</span>
            </div>
          </div>
          
          <div 
            className="p-6 rounded-2xl cursor-pointer hover:opacity-80 transition-all duration-200 border border-gray-800" 
            style={{ backgroundColor: '#000000' }}
            onClick={() => handleModuleClick('status', 'ZYNC')}
          >
            <div className="flex flex-col items-center space-y-3">
              <Activity className="h-10 w-10 text-green-400" />
              <span className="text-white font-bold text-lg">ZYNC</span>
              <span className="text-gray-400 text-sm text-center">IDE Interface</span>
            </div>
          </div>
          
          <div 
            className="p-6 rounded-2xl cursor-pointer hover:opacity-80 transition-all duration-200 border border-gray-800" 
            style={{ backgroundColor: '#000000' }}
            onClick={() => handleModuleClick('admin', 'ZETA')}
          >
            <div className="flex flex-col items-center space-y-3">
              <Shield className="h-10 w-10 text-blue-400" />
              <span className="text-white font-bold text-lg">ZETA</span>
              <span className="text-gray-400 text-sm text-center">Security Panel</span>
            </div>
          </div>
        </div>

        {/* Secondary Module Grid */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div 
            className="p-6 rounded-2xl cursor-pointer hover:opacity-80 transition-all duration-200 border border-gray-800" 
            style={{ backgroundColor: '#000000' }}
            onClick={() => handleModuleClick('zwap', 'ZWAP!')}
          >
            <div className="flex flex-col items-center space-y-3">
              <DollarSign className="h-10 w-10 text-pink-400" />
              <span className="text-white font-bold text-lg">ZWAP!</span>
              <span className="text-gray-400 text-sm text-center">Financial Utility</span>
            </div>
          </div>
          
          <div 
            className="p-6 rounded-2xl cursor-pointer hover:opacity-80 transition-all duration-200 border border-gray-800" 
            style={{ backgroundColor: '#000000' }}
            onClick={() => handleModuleClick('genealogy', 'LEGACY')}
          >
            <div className="flex flex-col items-center space-y-3">
              <FolderTree className="h-10 w-10 text-orange-400" />
              <span className="text-white font-bold text-lg">LEGACY</span>
              <span className="text-gray-400 text-sm text-center">Genealogy Archive</span>
            </div>
          </div>
          
          <div 
            className="p-6 rounded-2xl cursor-pointer hover:opacity-80 transition-all duration-200 border border-gray-800" 
            style={{ backgroundColor: '#000000' }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleModuleClick('config', 'Config');
            }}
          >
            <div className="flex flex-col items-center space-y-3">
              <Settings className="h-10 w-10 text-gray-400" />
              <span className="text-white font-bold text-lg">Config</span>
              <span className="text-gray-400 text-sm text-center">System Settings</span>
            </div>
          </div>
        </div>

        {/* System Status Bar */}
        <div className="flex justify-between items-center p-4 rounded-xl border border-gray-800 mb-6" style={{ backgroundColor: '#000000' }}>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-400 text-sm font-medium">Zebulon Core Active</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-blue-400 text-sm font-medium">Database Connected</span>
            </div>
          </div>
          <div className="text-gray-300 text-sm font-mono">
            {new Date().toLocaleTimeString()}
          </div>
        </div>

        {/* Active Module Content - Only show when a tab is selected */}
        {activeTab && (
          <div className="border border-gray-800 rounded-2xl p-6" style={{ backgroundColor: '#000000' }}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">

                {activeTab === 'status' && 'ZYNC IDE System'}
                {activeTab === 'admin' && 'ZETA Security Panel'}
                {activeTab === 'zwap' && 'ZWAP! Financial Utility'}

                {activeTab === 'zulu' && 'ZULU System Repairs'}
                {activeTab === 'config' && 'System Configuration'}
              </h2>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setActiveTab('')}
                className="text-gray-400 hover:text-white"
              >
                Back to Dashboard
              </Button>
            </div>



            {activeTab === 'status' && (
              <div className="space-y-4">
                <div className="p-4 rounded-lg border border-gray-800">
                  <h3 className="text-lg font-semibold text-white mb-4">ZYNC IDE Status</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Status</p>
                      <p className="text-white font-medium flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                        {systemStatus.oracleCore?.active ? 'Active' : 'Inactive'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Memory Usage</p>
                      <p className="text-white font-medium">{systemStatus.oracleCore?.memory || 92}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Active Queries</p>
                      <p className="text-white font-medium">{systemStatus.oracleCore?.queries || 847}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 mb-1">User</p>
                      <p className="text-white font-medium">{user?.username}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'admin' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Change Password</h3>
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div>
                      <Label htmlFor="currentPassword" className="text-white">Current Password</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                        className="border-gray-800 text-white"
                        style={{ backgroundColor: '#000000' }}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="newPassword" className="text-white">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                        className="border-gray-800 text-white"
                        style={{ backgroundColor: '#000000' }}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="confirmPassword" className="text-white">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                        className="border-gray-800 text-white"
                        style={{ backgroundColor: '#000000' }}
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={changePasswordMutation.isPending}
                      className="text-white"
                      style={{ backgroundColor: '#3b82f6' }}
                    >
                      {changePasswordMutation.isPending ? 'Changing...' : 'Change Password'}
                    </Button>
                  </form>
                </div>
              </div>
            )}

            {activeTab === 'zwap' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="p-4 rounded-lg border border-gray-800" style={{ backgroundColor: '#000000' }}>
                    <h3 className="text-lg font-semibold text-white mb-4">Account Overview</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Balance</span>
                        <Badge variant="outline" className="text-green-400 border-green-400">$2,485.32</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Monthly Budget</span>
                        <Badge variant="outline" className="text-blue-400 border-blue-400">$3,200</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Savings Goal</span>
                        <Badge variant="outline" className="text-purple-400 border-purple-400">67%</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg border border-gray-800" style={{ backgroundColor: '#000000' }}>
                    <h3 className="text-lg font-semibold text-white mb-4">Financial Tools</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Expense Tracking</span>
                        <Badge variant="outline" className="text-green-400 border-green-400">Active</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Bill Reminders</span>
                        <Badge variant="outline" className="text-orange-400 border-orange-400">3 Pending</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Investment Monitor</span>
                        <Badge variant="outline" className="text-pink-400 border-pink-400">+12.8%</Badge>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-center text-gray-400">
                  <p>ZWAP! financial utility - Track expenses, manage budgets, and monitor investments</p>
                </div>
              </div>
            )}

            {activeTab === 'oracle' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="p-4 rounded-lg border border-gray-800" style={{ backgroundColor: '#000000' }}>
                    <h3 className="text-lg font-semibold text-white mb-4">Database Status</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Connection</span>
                        <Badge variant="outline" className="text-green-400 border-green-400">Connected</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Provider</span>
                        <Badge variant="outline" className="text-orange-400 border-orange-400">PostgreSQL</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Tables</span>
                        <Badge variant="outline" className="text-blue-400 border-blue-400">3 Active</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg border border-gray-800" style={{ backgroundColor: '#000000' }}>
                    <h3 className="text-lg font-semibold text-white mb-4">Data Overview</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Users</span>
                        <Badge variant="outline" className="text-purple-400 border-purple-400">2 Records</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Messages</span>
                        <Badge variant="outline" className="text-green-400 border-green-400">Active Logging</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">System Status</span>
                        <Badge variant="outline" className="text-blue-400 border-blue-400">Monitoring</Badge>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-center text-gray-400">
                  <p>Oracle database core is operational and ready for advanced queries</p>
                </div>
              </div>
            )}

            {activeTab === 'zulu' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="p-4 rounded-lg border border-gray-800" style={{ backgroundColor: '#000000' }}>
                    <h3 className="text-lg font-semibold text-white mb-4">System Diagnostics</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">CPU Health</span>
                        <Badge variant="outline" className="text-green-400 border-green-400">Optimal</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Memory Status</span>
                        <Badge variant="outline" className="text-blue-400 border-blue-400">74% Used</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Disk Health</span>
                        <Badge variant="outline" className="text-green-400 border-green-400">Good</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg border border-gray-800" style={{ backgroundColor: '#000000' }}>
                    <h3 className="text-lg font-semibold text-white mb-4">Repair Tools</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Auto Cleanup</span>
                        <Badge variant="outline" className="text-green-400 border-green-400">Enabled</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Error Scanner</span>
                        <Badge variant="outline" className="text-orange-400 border-orange-400">Running</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Registry Check</span>
                        <Badge variant="outline" className="text-purple-400 border-purple-400">Scheduled</Badge>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-center text-gray-400">
                  <p>ZULU system repair and maintenance tools for optimal performance</p>
                </div>
              </div>
            )}

            {activeTab === 'config' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="p-4 rounded-lg border border-gray-800" style={{ backgroundColor: '#000000' }}>
                    <h3 className="text-lg font-semibold text-white mb-4">System Settings</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Environment</span>
                        <Badge variant="outline" className="text-green-400 border-green-400">Development</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Port</span>
                        <Badge variant="outline" className="text-blue-400 border-blue-400">5000</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Architecture</span>
                        <Badge variant="outline" className="text-purple-400 border-purple-400">Unified</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg border border-gray-800" style={{ backgroundColor: '#000000' }}>
                    <h3 className="text-lg font-semibold text-white mb-4">AI Configuration</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Zebulon Core</span>
                        <Badge variant="outline" className="text-green-400 border-green-400">Active</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Response Mode</span>
                        <Badge variant="outline" className="text-orange-400 border-orange-400">Contextual</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Memory</span>
                        <Badge variant="outline" className="text-pink-400 border-pink-400">Persistent</Badge>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-center text-gray-400">
                  <p>System configuration and settings management interface</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Oracle Database Interface - Full Screen Overlay */}
      {showOracleDatabase && (
        <div className="fixed inset-0 z-50">
          <OracleDatabase onClose={() => setShowOracleDatabase(false)} />
        </div>
      )}

      {/* Module Settings Interface */}
      {showModuleSettings.show && (
        <div className="fixed inset-0 z-50">
          <ModuleSettings
            moduleName={showModuleSettings.moduleName}
            displayName={showModuleSettings.displayName}
            onClose={() => setShowModuleSettings({ show: false, moduleName: '', displayName: '' })}
            onSave={handleIntegrationSave}
          />
        </div>
      )}

      {/* Active Module Integration Interface */}
      {activeIntegration && (
        <div className="fixed inset-0 z-50">
          <ModuleIntegrationComponent
            integration={activeIntegration}
            onClose={() => setActiveIntegration(null)}
          />
        </div>
      )}



      {/* Config Interface - Full Screen Overlay */}
      {showConfigInterface && (
        <div className="fixed inset-0 z-50 bg-black">
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-800">
              <h1 className="text-2xl font-bold text-white">System Configuration</h1>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowConfigInterface(false)}
                className="text-gray-400 hover:text-white"
              >
                Back to Dashboard
              </Button>
            </div>
            
            {/* Config Content */}
            <div className="flex-1 p-6">
              <div className="max-w-md mx-auto space-y-6">
                <Card className="bg-gray-900 border-gray-800">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Change Password</h3>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="current-password" className="text-gray-300">Current Password</Label>
                        <Input
                          id="current-password"
                          type="password"
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                          className="bg-gray-800 border-gray-700 text-white"
                        />
                      </div>
                      <div>
                        <Label htmlFor="new-password" className="text-gray-300">New Password</Label>
                        <Input
                          id="new-password"
                          type="password"
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                          className="bg-gray-800 border-gray-700 text-white"
                        />
                      </div>
                      <div>
                        <Label htmlFor="confirm-password" className="text-gray-300">Confirm New Password</Label>
                        <Input
                          id="confirm-password"
                          type="password"
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          className="bg-gray-800 border-gray-700 text-white"
                        />
                      </div>
                      <Button 
                        onClick={handlePasswordChange}
                        disabled={changePasswordMutation.isPending}
                        className="w-full bg-purple-600 hover:bg-purple-700"
                      >
                        {changePasswordMutation.isPending ? 'Changing...' : 'Change Password'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gray-900 border-gray-800">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">System Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Environment:</span>
                        <span className="text-white">Development</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Port:</span>
                        <span className="text-white">5000</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Database:</span>
                        <span className="text-green-400">Connected</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Version:</span>
                        <span className="text-white">1.0.0</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Genealogy Module */}
      {showGenealogyModule && (
        <GenealogyModule onBack={() => setShowGenealogyModule(false)} />
      )}
    </div>
  );
};

export default ZebulonSimple;