import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Check, X, Settings, Shield, Brain, Database, Mic } from 'lucide-react';
import { ZedMemoryPanel } from './ZedMemoryPanel';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface UserConfig {
  dashboard: {
    layout: string;
    theme: string;
    autoRefresh: boolean;
    refreshInterval: number;
  };
  zedCore: {
    permissions: {
      canExecuteQueries: boolean;
      canModifyData: boolean;
      canCreateTables: boolean;
      canDropTables: boolean;
      canManageUsers: boolean;
      canAccessSystemStatus: boolean;
      canModifySettings: boolean;
      canReadFiles: boolean;
      canWriteFiles: boolean;
      canDeleteFiles: boolean;
      canConnectToOracle: boolean;
      canManageConnections: boolean;
      canRunStoredProcedures: boolean;
    };
    behavior: {
      requireConfirmation: boolean;
      confirmationTimeout: number;
      maxActionsPerSession: number;
      autoExecuteSimpleQueries: boolean;
      enableLearningMode: boolean;
      verboseLogging: boolean;
    };
    aiSettings: {
      model: string;
      temperature: number;
      maxTokens: number;
      responseStyle: string;
      enableContextMemory: boolean;
      contextWindow: number;
    };
  };
  zetaCore: {
    monitoring: {
      enabled: boolean;
      alertLevel: string;
      realTimeScanning: boolean;
      behaviorAnalysis: boolean;
      anomalyDetection: boolean;
    };
  };
  fantasmaFirewall: {
    protection: {
      enabled: boolean;
      automaticScanning: boolean;
      scanInterval: number;
      deepScan: boolean;
      quarantineThreats: boolean;
    };
  };
  oracle: {
    connections: {
      maxConnections: number;
      connectionTimeout: number;
      autoReconnect: boolean;
      pooling: boolean;
    };
  };
  audio: {
    voiceCommands: boolean;
    language: string;
    sensitivity: number;
    wakeWord: string;
  };
}

interface ProcessAuthorization {
  id: number;
  processType: string;
  description: string;
  parameters: any;
  status: string;
  priority: string;
  requestedAt: string;
  approvedAt?: string;
  rejectedAt?: string;
}

interface ZedConfigPanelProps {
  userId: number;
}

export default function ZedConfigPanel({ userId }: ZedConfigPanelProps) {
  const queryClient = useQueryClient();

  // Fetch user configuration
  const { data: config, isLoading: configLoading } = useQuery<UserConfig>({
    queryKey: ['/api/config', userId],
    queryFn: () => apiRequest(`/api/config/${userId}`)
  });

  // Fetch pending authorizations
  const { data: authorizations, isLoading: authLoading } = useQuery<any[]>({
    queryKey: ['/api/authorizations', userId],
    queryFn: () => apiRequest(`/api/authorizations/${userId}`)
  });

  // Update configuration mutation
  const updateConfigMutation = useMutation({
    mutationFn: (newConfig: Partial<UserConfig>) => 
      apiRequest(`/api/config/${userId}`, 'PUT', newConfig),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/config', userId] });
    }
  });

  // Approve authorization mutation
  const approveAuthMutation = useMutation({
    mutationFn: ({ authId }: { authId: number }) =>
      apiRequest(`/api/authorize/${authId}/approve`, 'POST', { approverId: userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/authorizations', userId] });
    }
  });

  // Reject authorization mutation  
  const rejectAuthMutation = useMutation({
    mutationFn: ({ authId }: { authId: number }) =>
      apiRequest(`/api/authorize/${authId}/reject`, 'POST', { approverId: userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/authorizations', userId] });
    }
  });

  const updateConfig = (section: string, key: string, value: any) => {
    if (!config) return;
    
    const newConfig = {
      ...config,
      [section]: {
        ...config[section],
        [key]: value
      }
    };
    
    updateConfigMutation.mutate(newConfig);
  };

  const updateNestedConfig = (section: string, subsection: string, key: string, value: any) => {
    if (!config) return;
    
    const newConfig = {
      ...config,
      [section]: {
        ...config[section],
        [subsection]: {
          ...config[section][subsection],
          [key]: value
        }
      }
    };
    
    updateConfigMutation.mutate(newConfig);
  };

  if (configLoading) {
    return <div className="p-6">Loading configuration...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold zebulon-text-gradient">Zed Configuration</h1>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="border-primary">
            Advanced Settings
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="permissions" className="space-y-6">
        <TabsList className="zebulon-card">
          <TabsTrigger value="permissions" className="flex items-center space-x-2">
            <Shield className="w-4 h-4" />
            <span>Permissions</span>
          </TabsTrigger>
          <TabsTrigger value="behavior" className="flex items-center space-x-2">
            <Brain className="w-4 h-4" />
            <span>Behavior</span>
          </TabsTrigger>
          <TabsTrigger value="memory" className="flex items-center space-x-2">
            <Database className="w-4 h-4" />
            <span>Memory Core</span>
          </TabsTrigger>
          <TabsTrigger value="systems" className="flex items-center space-x-2">
            <Settings className="w-4 h-4" />
            <span>Systems</span>
          </TabsTrigger>
          <TabsTrigger value="authorizations" className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4" />
            <span>Authorizations ({authorizations?.length || 0})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="permissions" className="space-y-4">
          <Card className="zebulon-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-primary" />
                <span>Zed Core Permissions</span>
              </CardTitle>
              <CardDescription>
                Control what actions Zed can perform autonomously or with your approval
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(config?.zedCore?.permissions || {}).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-3 rounded-lg border border-border">
                    <label className="text-sm font-medium capitalize">
                      {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                    </label>
                    <Switch
                      checked={value as boolean}
                      onCheckedChange={(checked) => 
                        updateNestedConfig('zedCore', 'permissions', key, checked)
                      }
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="behavior" className="space-y-4">
          <Card className="zebulon-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Brain className="w-5 h-5 text-primary" />
                <span>Zed Behavior Settings</span>
              </CardTitle>
              <CardDescription>
                Configure how Zed interacts with you and handles requests
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Require Confirmation</label>
                  <p className="text-sm text-muted-foreground">Ask for approval before executing actions</p>
                </div>
                <Switch
                  checked={config?.zedCore?.behavior?.requireConfirmation}
                  onCheckedChange={(checked) => 
                    updateNestedConfig('zedCore', 'behavior', 'requireConfirmation', checked)
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Confirmation Timeout (seconds)</label>
                <Slider
                  value={[config?.zedCore?.behavior?.confirmationTimeout / 1000 || 30]}
                  onValueChange={([value]) => 
                    updateNestedConfig('zedCore', 'behavior', 'confirmationTimeout', value * 1000)
                  }
                  max={60}
                  min={5}
                  step={5}
                  className="w-full"
                />
                <p className="text-sm text-muted-foreground">
                  {config?.zedCore?.behavior?.confirmationTimeout / 1000 || 30} seconds
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">AI Response Style</label>
                <Select
                  value={config?.zedCore?.aiSettings?.responseStyle}
                  onValueChange={(value) => 
                    updateNestedConfig('zedCore', 'aiSettings', 'responseStyle', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="concise">Concise</SelectItem>
                    <SelectItem value="detailed">Detailed</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="friendly">Friendly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="memory" className="space-y-4">
          <Card className="zebulon-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="w-5 h-5 text-primary" />
                <span>Zed Memory Core</span>
              </CardTitle>
              <CardDescription>
                Encrypted AI memory management system with AES-256 security
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ZedMemoryPanel userId={userId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="systems" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="zebulon-card">
              <CardHeader>
                <CardTitle>Zeta Core Security</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Real-time Monitoring</label>
                  <Switch
                    checked={config?.zetaCore?.monitoring?.enabled}
                    onCheckedChange={(checked) => 
                      updateNestedConfig('zetaCore', 'monitoring', 'enabled', checked)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Alert Level</label>
                  <Select
                    value={config?.zetaCore?.monitoring?.alertLevel}
                    onValueChange={(value) => 
                      updateNestedConfig('zetaCore', 'monitoring', 'alertLevel', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="zebulon-card">
              <CardHeader>
                <CardTitle>Oracle Database</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Max Connections</label>
                  <Slider
                    value={[config?.oracle?.connections?.maxConnections || 10]}
                    onValueChange={([value]) => 
                      updateNestedConfig('oracle', 'connections', 'maxConnections', value)
                    }
                    max={100}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <p className="text-sm text-muted-foreground">
                    {config?.oracle?.connections?.maxConnections || 10} connections
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Auto Reconnect</label>
                  <Switch
                    checked={config?.oracle?.connections?.autoReconnect}
                    onCheckedChange={(checked) => 
                      updateNestedConfig('oracle', 'connections', 'autoReconnect', checked)
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="authorizations" className="space-y-4">
          <Card className="zebulon-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-primary" />
                <span>Pending Authorizations</span>
              </CardTitle>
              <CardDescription>
                Review and approve Zed's requests for sensitive operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {authLoading ? (
                <div>Loading authorizations...</div>
              ) : !authorizations || authorizations.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No pending authorizations
                </div>
              ) : (
                <div className="space-y-4">
                  {authorizations.map((auth: ProcessAuthorization) => (
                    <div key={auth.id} className="border border-border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className={
                            auth.priority === 'critical' ? 'border-red-500' :
                            auth.priority === 'high' ? 'border-orange-500' :
                            auth.priority === 'medium' ? 'border-yellow-500' : 'border-green-500'
                          }>
                            {auth.priority}
                          </Badge>
                          <span className="font-medium capitalize">
                            {auth.processType.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => approveAuthMutation.mutate({ authId: auth.id })}
                            disabled={approveAuthMutation.isPending}
                            className="text-green-600 border-green-600 hover:bg-green-50"
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => rejectAuthMutation.mutate({ authId: auth.id })}
                            disabled={rejectAuthMutation.isPending}
                            className="text-red-600 border-red-600 hover:bg-red-50"
                          >
                            <X className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{auth.description}</p>
                      <div className="text-xs text-muted-foreground">
                        Requested: {new Date(auth.requestedAt).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}