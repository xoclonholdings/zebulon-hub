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
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth < 768);
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

  // Handle mobile viewport changes
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    <div className="space-y-6">
      <div className="text-center pb-4 border-b border-white/10">
        <h3 className="font-bold text-lg text-white mb-2">Visual Customization</h3>
        <p className="text-sm text-gray-400">Customize Zebulon's appearance with magenta-blue gradient theme</p>
      </div>
      
      <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
        <div className="p-3 bg-black/30 rounded-lg border border-white/10 space-y-3">
          <Label className="text-white font-medium flex items-center gap-2 text-sm">
            <Palette className="h-4 w-4 text-pink-400" />
            Primary Color (Magenta)
          </Label>
          <div className="flex items-center space-x-3">
            <Input
              type="color"
              value={localConfig.theme?.primaryColor || '#ff0080'}
              onChange={(e) => updateConfig('theme', 'primaryColor', e.target.value)}
              className="w-12 h-12 p-1 border-2 border-pink-400/30 rounded-lg cursor-pointer bg-transparent"
            />
            <Input
              type="text"
              value={localConfig.theme?.primaryColor || '#ff0080'}
              onChange={(e) => updateConfig('theme', 'primaryColor', e.target.value)}
              className="flex-1 h-10 bg-white/5 border border-white/20 text-white rounded-md font-mono text-sm"
              placeholder="#ff0080"
            />
          </div>
        </div>
        
        <div className="p-3 bg-black/30 rounded-lg border border-white/10 space-y-3">
          <Label className="text-white font-medium flex items-center gap-2 text-sm">
            <Palette className="h-4 w-4 text-blue-400" />
            Secondary Color (Blue)
          </Label>
          <div className="flex items-center space-x-3">
            <Input
              type="color"
              value={localConfig.theme?.secondaryColor || '#0080ff'}
              onChange={(e) => updateConfig('theme', 'secondaryColor', e.target.value)}
              className="w-12 h-12 p-1 border-2 border-blue-400/30 rounded-lg cursor-pointer bg-transparent"
            />
            <Input
              type="text"
              value={localConfig.theme?.secondaryColor || '#0080ff'}
              onChange={(e) => updateConfig('theme', 'secondaryColor', e.target.value)}
              className="flex-1 h-10 bg-white/5 border border-white/20 text-white rounded-md font-mono text-sm"
              placeholder="#0080ff"
            />
          </div>
        </div>
      </div>

      <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
        <div className="p-3 bg-black/30 rounded-lg border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <Label className="text-white font-medium text-sm">Background Opacity</Label>
            <Badge variant="outline" className="text-white border-white/30">
              {localConfig.theme?.opacity || 95}%
            </Badge>
          </div>
          <Slider
            value={[localConfig.theme?.opacity || 95]}
            onValueChange={(value) => updateConfig('theme', 'opacity', value[0])}
            max={100}
            min={10}
            step={5}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-2">
            <span>10%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>

        <div className="p-3 bg-black/30 rounded-lg border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <Label className="text-white font-medium text-sm">Glow Intensity</Label>
            <Badge variant="outline" className="text-white border-white/30">
              {localConfig.theme?.glowIntensity || 50}%
            </Badge>
          </div>
          <Slider
            value={[localConfig.theme?.glowIntensity || 50]}
            onValueChange={(value) => updateConfig('theme', 'glowIntensity', value[0])}
            max={100}
            min={0}
            step={10}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-2">
            <span>Off</span>
            <span>Normal</span>
            <span>Maximum</span>
          </div>
        </div>
      </div>

      <div className="p-4 bg-black/30 rounded-lg border border-white/10 space-y-3">
        <Label className="text-white font-medium">Animation Speed</Label>
        <Select value={localConfig.theme?.animationSpeed || 'normal'} onValueChange={(value) => updateConfig('theme', 'animationSpeed', value)}>
          <SelectTrigger className="bg-white/5 border-white/20 text-white h-10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-black border-white/20">
            <SelectItem value="slow">Slow</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="fast">Fast</SelectItem>
            <SelectItem value="off">Disabled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Live Preview */}
      <div className="p-4 bg-black/30 rounded-lg border border-white/10">
        <Label className="text-white font-medium mb-3 block">Live Preview</Label>
        <div 
          className="p-6 rounded-lg border-2 transition-all duration-300 text-center"
          style={{
            backgroundColor: `rgba(0, 0, 0, ${(localConfig.theme?.opacity || 95) / 100})`,
            borderColor: localConfig.theme?.primaryColor || '#ff0080',
            boxShadow: `0 0 ${(localConfig.theme?.glowIntensity || 50) / 5}px ${localConfig.theme?.primaryColor || '#ff0080'}66`
          }}
        >
          <div 
            className="font-bold text-xl mb-2"
            style={{
              background: `linear-gradient(45deg, ${localConfig.theme?.primaryColor || '#ff0080'}, ${localConfig.theme?.secondaryColor || '#0080ff'})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            ZEBULON™ PREVIEW
          </div>
          <p className="text-white/75 text-sm">Your customized theme in action</p>
        </div>
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
    <div className="w-full h-full bg-black bg-opacity-95 rounded-lg text-white flex flex-col overflow-hidden">
      {/* Enhanced Header with gradient accent */}
      <div className="flex items-center justify-between p-6 border-b border-gradient-to-r from-pink-500/20 to-blue-500/20 bg-gradient-to-r from-pink-500/5 to-blue-500/5">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-r from-pink-500 to-blue-500 rounded-lg shadow-lg">
            <Settings className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-xl bg-gradient-to-r from-pink-400 to-blue-400 bg-clip-text text-transparent">Zebulon Configuration</span>
            <p className="text-sm text-gray-400 mt-0.5">Customize your AI ecosystem to maximum potential</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {unsavedChanges && (
            <Badge className="bg-gradient-to-r from-orange-500/20 to-yellow-500/20 text-orange-300 border border-orange-400/30 text-xs px-3 py-1 animate-pulse">
              Unsaved Changes
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => exportConfigMutation.mutate()}
            className="h-9 px-3 text-sm bg-white/10 hover:bg-white/20 border border-white/20 transition-all duration-200"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Main Content Area with improved layout */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile/Desktop Navigation */}
        {isMobile ? (
          /* Mobile: Horizontal scrollable tabs */
          <div className="p-3 border-b border-white/10 bg-black/20">
            <ScrollArea className="w-full">
              <div className="flex space-x-2 pb-2">
                {sections.map((section) => {
                  const Icon = section.icon;
                  const isActive = activeSection === section.id;
                  return (
                    <Button
                      key={section.id}
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveSection(section.id)}
                      className={`flex-shrink-0 h-8 px-3 text-xs font-medium transition-all duration-200 ${
                        isActive 
                          ? 'bg-gradient-to-r from-pink-500/20 to-blue-500/20 text-white border border-pink-400/30' 
                          : 'bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-transparent hover:border-white/20'
                      }`}
                    >
                      <Icon className="h-3 w-3 mr-1" />
                      <span className="whitespace-nowrap">{section.label}</span>
                    </Button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        ) : (
          /* Desktop: Side navigation */
          <div className="flex flex-1 overflow-hidden">
            <div className="w-64 p-4 border-r border-white/10 bg-black/20">
              <div className="space-y-2">
                {sections.map((section) => {
                  const Icon = section.icon;
                  const isActive = activeSection === section.id;
                  return (
                    <Button
                      key={section.id}
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full justify-start h-12 px-4 text-sm font-medium transition-all duration-200 ${
                        isActive 
                          ? 'bg-gradient-to-r from-pink-500/20 to-blue-500/20 text-white border border-pink-400/30' 
                          : 'bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-transparent hover:border-white/20'
                      }`}
                    >
                      <Icon className="h-4 w-4 mr-3" />
                      {section.label}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Configuration Content with better spacing */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 p-6 overflow-hidden">
                <ScrollArea className="h-full pr-2">
                  <div className="space-y-6">
                    {renderCurrentSection()}
                  </div>
                </ScrollArea>
              </div>

              {/* Action Buttons with enhanced styling */}
              <div className="flex items-center justify-between p-6 border-t border-white/10 bg-black/20">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  disabled={resetConfigMutation.isPending}
                  className="h-10 px-4 text-sm bg-red-900/20 hover:bg-red-900/30 text-red-300 hover:text-red-200 border border-red-500/30 transition-all duration-200"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset to Defaults
                </Button>
                
                <Button
                  onClick={handleSave}
                  disabled={!unsavedChanges || saveConfigMutation.isPending}
                  className="h-10 px-6 text-sm bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saveConfigMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Mobile: Configuration Content (full width) */}
        {isMobile && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 p-3 overflow-hidden">
              <ScrollArea className="h-full pr-2">
                <div className="space-y-4">
                  {renderCurrentSection()}
                </div>
              </ScrollArea>
            </div>

            {/* Action Buttons with enhanced styling */}
            <div className={`flex items-center justify-between border-t border-white/10 bg-black/20 ${isMobile ? 'p-3 space-x-2' : 'p-6'}`}>
              <Button
                variant="ghost"
                size={isMobile ? "sm" : "default"}
                onClick={handleReset}
                disabled={resetConfigMutation.isPending}
                className={`bg-red-900/20 hover:bg-red-900/30 text-red-300 hover:text-red-200 border border-red-500/30 transition-all duration-200 ${isMobile ? 'h-8 px-3 text-xs' : 'h-10 px-4 text-sm'}`}
              >
                <RotateCcw className={`mr-1 ${isMobile ? 'h-3 w-3' : 'h-4 w-4 mr-2'}`} />
                {isMobile ? 'Reset' : 'Reset to Defaults'}
              </Button>
              
              <Button
                onClick={handleSave}
                disabled={!unsavedChanges || saveConfigMutation.isPending}
                className={`bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${isMobile ? 'h-8 px-4 text-xs' : 'h-10 px-6 text-sm'}`}
              >
                <Save className={`mr-1 ${isMobile ? 'h-3 w-3' : 'h-4 w-4 mr-2'}`} />
                {saveConfigMutation.isPending ? 'Saving...' : (isMobile ? 'Save' : 'Save Changes')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}