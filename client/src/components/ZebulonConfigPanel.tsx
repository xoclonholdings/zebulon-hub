import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Slider } from './ui/slider';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  Settings, 
  Palette, 
  Volume2, 
  Shield, 
  Database, 
  Brain, 
  Lock, 
  Monitor, 
  Keyboard, 
  Eye, 
  Zap, 
  Timer, 
  Globe,
  Save,
  RotateCcw,
  Download,
  Upload
} from 'lucide-react';

interface ZebulonConfig {
  id: number;
  userId: number;
  
  // Visual Customization
  theme: {
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    textColor: string;
    opacity: number;
    glowIntensity: number;
    animationSpeed: string;
    logoSize: number;
  };
  
  // Core System Settings
  zedCore: {
    enabled: boolean;
    responseDelay: number;
    contextMemory: number;
    autoApproval: boolean;
    learningMode: boolean;
    personality: string;
    voiceEnabled: boolean;
    adaptiveBehavior: boolean;
  };
  
  zetaCore: {
    enabled: boolean;
    securityLevel: string;
    autoBlock: boolean;
    threatDetection: boolean;
    auditLevel: string;
    alertThreshold: string;
    realTimeMonitoring: boolean;
    behaviorAnalysis: boolean;
  };
  
  fantasmaFirewall: {
    enabled: boolean;
    stealthMode: boolean;
    scanInterval: number;
    deepScanEnabled: boolean;
    autoQuarantine: boolean;
    trafficObfuscation: boolean;
    logRetention: number;
    emergencyMode: boolean;
  };
  
  // Interface Customization
  interface: {
    layout: string;
    widgetSize: string;
    chatPosition: string;
    enableVoice: boolean;
    enableGestures: boolean;
    autoHide: boolean;
    compactMode: boolean;
    multiMonitor: boolean;
  };
  
  // Oracle Integration
  oracle: {
    defaultTimeout: number;
    maxConnections: number;
    autoCommit: boolean;
    queryLogging: boolean;
    performanceMode: string;
    compressionEnabled: boolean;
    encryptionLevel: string;
  };
  
  // Behavioral Settings
  behavior: {
    contextAwareness: number;
    adaptivePersonality: boolean;
    learningFromInteractions: boolean;
    proactiveAssistance: boolean;
    emotionalIntelligence: boolean;
    customRoutines: string[];
    workflowAutomation: boolean;
  };
  
  // Security & Privacy
  security: {
    biometricAuth: boolean;
    sessionTimeout: number;
    dataEncryption: string;
    auditTrail: boolean;
    anonymousMode: boolean;
    secureDelete: boolean;
    vpnIntegration: boolean;
  };
}

interface ConfigPanelProps {
  userId: number;
}

export function ZebulonConfigPanel({ userId }: ConfigPanelProps) {
  const [activeSection, setActiveSection] = useState<string>('theme');
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current configuration
  const { data: config, isLoading } = useQuery<ZebulonConfig>({
    queryKey: [`/api/config/${userId}`],
    staleTime: 30000,
  });

  // Local state for configuration
  const [localConfig, setLocalConfig] = useState<Partial<ZebulonConfig>>({});

  useEffect(() => {
    if (config) {
      setLocalConfig(config);
    }
  }, [config]);

  // Save configuration mutation
  const saveConfigMutation = useMutation({
    mutationFn: (configData: Partial<ZebulonConfig>) =>
      apiRequest(`/api/config/${userId}`, 'PUT', configData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/config/${userId}`] });
      setUnsavedChanges(false);
      toast({
        title: "Configuration Saved",
        description: "Your Zebulon settings have been updated successfully."
      });
    },
    onError: () => {
      toast({
        title: "Save Failed",
        description: "Failed to save configuration. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Reset to defaults mutation
  const resetConfigMutation = useMutation({
    mutationFn: () => apiRequest(`/api/config/${userId}/reset`, 'POST'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/config/${userId}`] });
      setUnsavedChanges(false);
      toast({
        title: "Configuration Reset",
        description: "All settings have been restored to defaults."
      });
    }
  });

  // Export/Import mutations
  const exportConfigMutation = useMutation({
    mutationFn: () => apiRequest(`/api/config/${userId}/export`, 'GET'),
    onSuccess: (data) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `zebulon-config-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({
        title: "Configuration Exported",
        description: "Your settings have been downloaded."
      });
    }
  });

  const updateConfig = (section: string, key: string, value: any) => {
    setLocalConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof ZebulonConfig],
        [key]: value
      }
    }));
    setUnsavedChanges(true);
  };

  const handleSave = () => {
    saveConfigMutation.mutate(localConfig);
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
      resetConfigMutation.mutate();
    }
  };

  const sections = [
    { id: 'theme', label: 'Theme', icon: Palette },
    { id: 'zed', label: 'Zed Core', icon: Brain },
    { id: 'zeta', label: 'Zeta Core', icon: Shield },
    { id: 'fantasma', label: 'Fantasma', icon: Lock },
    { id: 'interface', label: 'Interface', icon: Monitor },
    { id: 'oracle', label: 'Oracle', icon: Database },
    { id: 'behavior', label: 'Behavior', icon: Zap },
    { id: 'security', label: 'Security', icon: Eye }
  ];

  if (isLoading) {
    return (
      <div className="w-full h-full bg-black bg-opacity-20 rounded-lg p-4 flex items-center justify-center">
        <div className="text-white text-opacity-75">Loading configuration...</div>
      </div>
    );
  }

  const renderThemeSection = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-white text-sm">Primary Color</Label>
          <Input
            type="color"
            value={localConfig.theme?.primaryColor || '#8b5cf6'}
            onChange={(e) => updateConfig('theme', 'primaryColor', e.target.value)}
            className="h-8 w-16"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-white text-sm">Secondary Color</Label>
          <Input
            type="color"
            value={localConfig.theme?.secondaryColor || '#3b82f6'}
            onChange={(e) => updateConfig('theme', 'secondaryColor', e.target.value)}
            className="h-8 w-16"
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label className="text-white text-sm">Background Opacity: {localConfig.theme?.opacity || 95}%</Label>
        <Slider
          value={[localConfig.theme?.opacity || 95]}
          onValueChange={(value) => updateConfig('theme', 'opacity', value[0])}
          max={100}
          min={10}
          step={5}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-white text-sm">Glow Intensity: {localConfig.theme?.glowIntensity || 50}%</Label>
        <Slider
          value={[localConfig.theme?.glowIntensity || 50]}
          onValueChange={(value) => updateConfig('theme', 'glowIntensity', value[0])}
          max={100}
          min={0}
          step={10}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-white text-sm">Animation Speed</Label>
        <Select value={localConfig.theme?.animationSpeed || 'normal'} onValueChange={(value) => updateConfig('theme', 'animationSpeed', value)}>
          <SelectTrigger className="bg-white bg-opacity-10 border-white border-opacity-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="slow">Slow</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="fast">Fast</SelectItem>
            <SelectItem value="off">Disabled</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const renderZedCoreSection = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-white text-sm">Enable Zed Core</Label>
        <Switch
          checked={localConfig.zedCore?.enabled !== false}
          onCheckedChange={(checked) => updateConfig('zedCore', 'enabled', checked)}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-white text-sm">Response Delay: {localConfig.zedCore?.responseDelay || 500}ms</Label>
        <Slider
          value={[localConfig.zedCore?.responseDelay || 500]}
          onValueChange={(value) => updateConfig('zedCore', 'responseDelay', value[0])}
          max={5000}
          min={0}
          step={100}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-white text-sm">Context Memory: {localConfig.zedCore?.contextMemory || 100} messages</Label>
        <Slider
          value={[localConfig.zedCore?.contextMemory || 100]}
          onValueChange={(value) => updateConfig('zedCore', 'contextMemory', value[0])}
          max={1000}
          min={10}
          step={10}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-white text-sm">Personality Type</Label>
        <Select value={localConfig.zedCore?.personality || 'balanced'} onValueChange={(value) => updateConfig('zedCore', 'personality', value)}>
          <SelectTrigger className="bg-white bg-opacity-10 border-white border-opacity-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="professional">Professional</SelectItem>
            <SelectItem value="friendly">Friendly</SelectItem>
            <SelectItem value="balanced">Balanced</SelectItem>
            <SelectItem value="technical">Technical</SelectItem>
            <SelectItem value="creative">Creative</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between">
        <Label className="text-white text-sm">Auto-approval for Safe Operations</Label>
        <Switch
          checked={localConfig.zedCore?.autoApproval || false}
          onCheckedChange={(checked) => updateConfig('zedCore', 'autoApproval', checked)}
        />
      </div>

      <div className="flex items-center justify-between">
        <Label className="text-white text-sm">Adaptive Behavior Learning</Label>
        <Switch
          checked={localConfig.zedCore?.adaptiveBehavior || false}
          onCheckedChange={(checked) => updateConfig('zedCore', 'adaptiveBehavior', checked)}
        />
      </div>

      <div className="flex items-center justify-between">
        <Label className="text-white text-sm">Voice Interface</Label>
        <Switch
          checked={localConfig.zedCore?.voiceEnabled || false}
          onCheckedChange={(checked) => updateConfig('zedCore', 'voiceEnabled', checked)}
        />
      </div>
    </div>
  );

  const renderZetaCoreSection = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-white text-sm">Enable Zeta Core Security</Label>
        <Switch
          checked={localConfig.zetaCore?.enabled !== false}
          onCheckedChange={(checked) => updateConfig('zetaCore', 'enabled', checked)}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-white text-sm">Security Level</Label>
        <Select value={localConfig.zetaCore?.securityLevel || 'high'} onValueChange={(value) => updateConfig('zetaCore', 'securityLevel', value)}>
          <SelectTrigger className="bg-white bg-opacity-10 border-white border-opacity-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low - Basic Monitoring</SelectItem>
            <SelectItem value="medium">Medium - Standard Protection</SelectItem>
            <SelectItem value="high">High - Enhanced Security</SelectItem>
            <SelectItem value="maximum">Maximum - Paranoid Mode</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-white text-sm">Threat Alert Threshold</Label>
        <Select value={localConfig.zetaCore?.alertThreshold || 'medium'} onValueChange={(value) => updateConfig('zetaCore', 'alertThreshold', value)}>
          <SelectTrigger className="bg-white bg-opacity-10 border-white border-opacity-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low - All Activities</SelectItem>
            <SelectItem value="medium">Medium - Suspicious Only</SelectItem>
            <SelectItem value="high">High - Critical Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between">
        <Label className="text-white text-sm">Auto-block Dangerous Queries</Label>
        <Switch
          checked={localConfig.zetaCore?.autoBlock !== false}
          onCheckedChange={(checked) => updateConfig('zetaCore', 'autoBlock', checked)}
        />
      </div>

      <div className="flex items-center justify-between">
        <Label className="text-white text-sm">Real-time Threat Detection</Label>
        <Switch
          checked={localConfig.zetaCore?.threatDetection !== false}
          onCheckedChange={(checked) => updateConfig('zetaCore', 'threatDetection', checked)}
        />
      </div>

      <div className="flex items-center justify-between">
        <Label className="text-white text-sm">Behavioral Pattern Analysis</Label>
        <Switch
          checked={localConfig.zetaCore?.behaviorAnalysis !== false}
          onCheckedChange={(checked) => updateConfig('zetaCore', 'behaviorAnalysis', checked)}
        />
      </div>
    </div>
  );

  const renderFantasmaSection = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-white text-sm">Enable Fantasma Firewall</Label>
        <Switch
          checked={localConfig.fantasmaFirewall?.enabled !== false}
          onCheckedChange={(checked) => updateConfig('fantasmaFirewall', 'enabled', checked)}
        />
      </div>

      <div className="flex items-center justify-between">
        <Label className="text-white text-sm">Stealth Mode</Label>
        <Switch
          checked={localConfig.fantasmaFirewall?.stealthMode || false}
          onCheckedChange={(checked) => updateConfig('fantasmaFirewall', 'stealthMode', checked)}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-white text-sm">Scan Interval: {localConfig.fantasmaFirewall?.scanInterval || 60} seconds</Label>
        <Slider
          value={[localConfig.fantasmaFirewall?.scanInterval || 60]}
          onValueChange={(value) => updateConfig('fantasmaFirewall', 'scanInterval', value[0])}
          max={3600}
          min={10}
          step={10}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-white text-sm">Log Retention: {localConfig.fantasmaFirewall?.logRetention || 30} days</Label>
        <Slider
          value={[localConfig.fantasmaFirewall?.logRetention || 30]}
          onValueChange={(value) => updateConfig('fantasmaFirewall', 'logRetention', value[0])}
          max={365}
          min={1}
          step={1}
          className="w-full"
        />
      </div>

      <div className="flex items-center justify-between">
        <Label className="text-white text-sm">Deep Scan Analysis</Label>
        <Switch
          checked={localConfig.fantasmaFirewall?.deepScanEnabled || false}
          onCheckedChange={(checked) => updateConfig('fantasmaFirewall', 'deepScanEnabled', checked)}
        />
      </div>

      <div className="flex items-center justify-between">
        <Label className="text-white text-sm">Auto Quarantine Threats</Label>
        <Switch
          checked={localConfig.fantasmaFirewall?.autoQuarantine || false}
          onCheckedChange={(checked) => updateConfig('fantasmaFirewall', 'autoQuarantine', checked)}
        />
      </div>

      <div className="flex items-center justify-between">
        <Label className="text-white text-sm">Traffic Obfuscation</Label>
        <Switch
          checked={localConfig.fantasmaFirewall?.trafficObfuscation || false}
          onCheckedChange={(checked) => updateConfig('fantasmaFirewall', 'trafficObfuscation', checked)}
        />
      </div>
    </div>
  );

  const renderCurrentSection = () => {
    switch (activeSection) {
      case 'theme': return renderThemeSection();
      case 'zed': return renderZedCoreSection();
      case 'zeta': return renderZetaCoreSection();
      case 'fantasma': return renderFantasmaSection();
      default: return <div className="text-white text-opacity-75 text-center py-8">Select a configuration section</div>;
    }
  };

  return (
    <div className="w-full h-full bg-black bg-opacity-20 rounded-lg p-4 text-white space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white border-opacity-10 pb-3">
        <div className="flex items-center space-x-2">
          <Settings className="h-5 w-5 text-purple-400" />
          <span className="font-semibold text-lg">Zebulon Configuration</span>
        </div>
        <div className="flex items-center space-x-2">
          {unsavedChanges && (
            <Badge className="bg-yellow-900 bg-opacity-30 text-yellow-400 border-yellow-500 border-opacity-30 text-xs">
              Unsaved Changes
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => exportConfigMutation.mutate()}
            className="h-8 px-2 text-xs bg-white bg-opacity-10 hover:bg-white hover:bg-opacity-20"
          >
            <Download className="h-3 w-3 mr-1" />
            Export
          </Button>
        </div>
      </div>

      <div className="flex space-x-4 h-96">
        {/* Section Navigation */}
        <div className="w-48 space-y-1">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <Button
                key={section.id}
                variant={activeSection === section.id ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setActiveSection(section.id)}
                className="w-full justify-start h-8 px-3 text-xs bg-white bg-opacity-10 hover:bg-white hover:bg-opacity-20"
              >
                <Icon className="h-3 w-3 mr-2" />
                {section.label}
              </Button>
            );
          })}
        </div>

        {/* Configuration Content */}
        <div className="flex-1 bg-black bg-opacity-30 rounded-lg p-4">
          <ScrollArea className="h-full">
            {renderCurrentSection()}
          </ScrollArea>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-3 border-t border-white border-opacity-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          disabled={resetConfigMutation.isPending}
          className="h-8 px-3 text-xs bg-red-900 bg-opacity-20 hover:bg-red-900 hover:bg-opacity-30 text-red-400"
        >
          <RotateCcw className="h-3 w-3 mr-1" />
          Reset to Defaults
        </Button>
        
        <Button
          onClick={handleSave}
          disabled={!unsavedChanges || saveConfigMutation.isPending}
          className="h-8 px-4 text-xs bg-green-900 bg-opacity-30 hover:bg-green-900 hover:bg-opacity-50 text-green-400"
        >
          <Save className="h-3 w-3 mr-1" />
          {saveConfigMutation.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}