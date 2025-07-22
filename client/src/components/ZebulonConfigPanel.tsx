import React, { useState, useEffect, useCallback } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Settings, 
  Eye, 
  Database, 
  Palette, 
  Zap,
  Monitor,
  Shield,
  Brain,
  Download,
  Upload,
  RotateCcw,
  Save,
  FileText,
  ChevronRight,
  Memory,
  Search,
  Trash2,
  Calendar,
  Tag,
  Star,
  Archive,
  RefreshCw,
  BarChart3
} from 'lucide-react';

interface ZebulonConfig {
  theme?: {
    primaryColor: string;
    secondaryColor: string;
    opacity: number;
    glowIntensity: number;
    darkMode: boolean;
    customFont: string;
  };
  zedCore?: {
    enabled: boolean;
    responseDelay: number;
    contextMemory: number;
    personality: string;
    autoApproval: boolean;
    adaptiveBehavior: boolean;
    voiceEnabled: boolean;
  };
  zetaCore?: {
    enabled: boolean;
    securityLevel: string;
    alertThreshold: string;
    autoBlock: boolean;
    threatDetection: boolean;
    behaviorAnalysis: boolean;
  };
  fantasmaFirewall?: {
    enabled: boolean;
    stealthMode: boolean;
    scanInterval: number;
    logRetention: number;
    deepScanEnabled: boolean;
    autoQuarantine: boolean;
    trafficObfuscation: boolean;
  };
}

interface ZebulonConfigPanelProps {
  userId: number;
}

const ZebulonConfigPanel: React.FC<ZebulonConfigPanelProps> = ({ userId }) => {
  const [activeSection, setActiveSection] = useState<string>('theme');
  const [localConfig, setLocalConfig] = useState<ZebulonConfig>({});
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [memorySearchQuery, setMemorySearchQuery] = useState('');
  const [memoryFilter, setMemoryFilter] = useState('all');
  const [selectedMemoryType, setSelectedMemoryType] = useState('');
  const queryClient = useQueryClient();

  // Fetch current configuration
  const { data: config = {} } = useQuery<ZebulonConfig>({
    queryKey: [`/api/config/${userId}`],
  });

  // Fetch memory bank data
  const { data: memories = [], isLoading: memoriesLoading } = useQuery({
    queryKey: [`/api/memory/${userId}/search`, memorySearchQuery, memoryFilter, selectedMemoryType],
    queryFn: () => {
      const params = new URLSearchParams({
        q: memorySearchQuery,
        sortBy: 'recent',
        limit: '50'
      });
      if (selectedMemoryType) {
        params.append('types', selectedMemoryType);
      }
      return apiRequest(`/api/memory/${userId}/search?${params.toString()}`);
    },
    enabled: activeSection === 'memory'
  });

  // Initialize local config when fetched
  useEffect(() => {
    if (config) {
      setLocalConfig(config);
    }
  }, [config]);

  // Update configuration mutation
  const updateConfigMutation = useMutation({
    mutationFn: (updatedConfig: ZebulonConfig) => 
      apiRequest(`/api/config/${userId}`, 'POST', updatedConfig),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/config/${userId}`] });
      setUnsavedChanges(false);
    }
  });

  // Export configuration mutation
  const exportConfigMutation = useMutation({
    mutationFn: () => 
      apiRequest(`/api/config/${userId}/export`, 'POST', {}),
    onSuccess: (data) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `zebulon-config-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  });

  // Delete memory mutation
  const deleteMemoryMutation = useMutation({
    mutationFn: (memoryId: number) => 
      apiRequest(`/api/memory/${userId}/${memoryId}`, 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/memory/${userId}/search`] });
    }
  });

  // Helper function to update config
  const updateConfig = useCallback((section: keyof ZebulonConfig, key: string, value: any) => {
    setLocalConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
    setUnsavedChanges(true);
  }, []);

  // Save changes
  const saveChanges = () => {
    updateConfigMutation.mutate(localConfig);
  };

  // Reset to defaults
  const resetToDefaults = () => {
    setLocalConfig({
      theme: {
        primaryColor: '#ff0080',
        secondaryColor: '#0080ff',
        opacity: 95,
        glowIntensity: 50,
        darkMode: true,
        customFont: 'Inter'
      },
      zedCore: {
        enabled: true,
        responseDelay: 500,
        contextMemory: 100,
        personality: 'balanced',
        autoApproval: false,
        adaptiveBehavior: false,
        voiceEnabled: false
      },
      zetaCore: {
        enabled: true,
        securityLevel: 'high',
        alertThreshold: 'medium',
        autoBlock: true,
        threatDetection: true,
        behaviorAnalysis: true
      },
      fantasmaFirewall: {
        enabled: true,
        stealthMode: false,
        scanInterval: 60,
        logRetention: 30,
        deepScanEnabled: false,
        autoQuarantine: false,
        trafficObfuscation: false
      }
    });
    setUnsavedChanges(true);
  };

  // Section navigation items
  const navigationItems = [
    { id: 'theme', icon: Palette, name: 'Theme', description: 'Visual customization' },
    { id: 'zed', icon: Brain, name: 'Zed Core', description: 'AI assistant settings' },
    { id: 'zeta', icon: Shield, name: 'Zeta Core', description: 'Security monitoring' },
    { id: 'memory', icon: Memory, name: 'Memory Bank', description: 'Zed AI memory management' },
    { id: 'fantasma', icon: Eye, name: 'Fantasma', description: 'Firewall protection' },
    { id: 'interface', icon: Monitor, name: 'Interface', description: 'Dashboard layout' },
    { id: 'oracle', icon: Database, name: 'Oracle', description: 'Database settings' },
    { id: 'behavior', icon: Zap, name: 'Behavior', description: 'AI learning patterns' },
    { id: 'security', icon: FileText, name: 'Security', description: 'Audit & monitoring' }
  ];

  const renderThemeSection = () => {
    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-3">
            <Label className="text-white font-medium">Primary Color</Label>
            <div className="flex items-center space-x-4">
              <input
                type="color"
                value={localConfig.theme?.primaryColor || '#ff0080'}
                onChange={(e) => updateConfig('theme', 'primaryColor', e.target.value)}
                className="w-12 h-12 rounded-lg border border-white/20 bg-transparent cursor-pointer"
              />
              <span className="text-sm text-gray-400 font-mono">
                {localConfig.theme?.primaryColor || '#ff0080'}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-white font-medium">Secondary Color</Label>
            <div className="flex items-center space-x-4">
              <input
                type="color"
                value={localConfig.theme?.secondaryColor || '#0080ff'}
                onChange={(e) => updateConfig('theme', 'secondaryColor', e.target.value)}
                className="w-12 h-12 rounded-lg border border-white/20 bg-transparent cursor-pointer"
              />
              <span className="text-sm text-gray-400 font-mono">
                {localConfig.theme?.secondaryColor || '#0080ff'}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-white font-medium">
              Opacity: {localConfig.theme?.opacity || 95}%
            </Label>
            <Slider
              value={[localConfig.theme?.opacity || 95]}
              onValueChange={(value) => updateConfig('theme', 'opacity', value[0])}
              max={100}
              min={10}
              step={5}
              className="w-full"
            />
          </div>

          <div className="space-y-3">
            <Label className="text-white font-medium">
              Glow Intensity: {localConfig.theme?.glowIntensity || 50}%
            </Label>
            <Slider
              value={[localConfig.theme?.glowIntensity || 50]}
              onValueChange={(value) => updateConfig('theme', 'glowIntensity', value[0])}
              max={100}
              min={0}
              step={10}
              className="w-full"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-white font-medium">Dark Mode</Label>
            <Switch
              checked={localConfig.theme?.darkMode !== false}
              onCheckedChange={(checked) => updateConfig('theme', 'darkMode', checked)}
            />
          </div>
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
              ZEBULON PREVIEW
            </div>
            <p className="text-white/75 text-sm">Your customized theme in action</p>
          </div>
        </div>
      </div>
    );
  };

  const renderZedCoreSection = () => {
    return (
      <div className="space-y-6">
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
      </div>
    );
  };

  const renderZetaCoreSection = () => {
    return (
      <div className="space-y-6">
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
                <SelectItem value="low">Low - Show All Activity</SelectItem>
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
      </div>
    );
  };

  const renderFantasmaSection = () => {
    return (
      <div className="space-y-6">
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
      </div>
    );
  };

  // Placeholder sections for remaining configuration options
  const renderInterfaceSection = () => {
    return (
      <div className="text-center py-8">
        <Monitor className="h-12 w-12 text-gray-500 mx-auto mb-4" />
        <p className="text-gray-400">Interface customization options coming soon...</p>
      </div>
    );
  };

  const renderOracleSection = () => {
    return (
      <div className="text-center py-8">
        <Database className="h-12 w-12 text-gray-500 mx-auto mb-4" />
        <p className="text-gray-400">Oracle administration settings coming soon...</p>
      </div>
    );
  };

  const renderBehaviorSection = () => {
    return (
      <div className="text-center py-8">
        <Zap className="h-12 w-12 text-gray-500 mx-auto mb-4" />
        <p className="text-gray-400">Behavior customization coming soon...</p>
      </div>
    );
  };

  const renderSecuritySection = () => {
    return (
      <div className="text-center py-8">
        <Eye className="h-12 w-12 text-gray-500 mx-auto mb-4" />
        <p className="text-gray-400">Security dashboard coming soon...</p>
      </div>
    );
  };

  const renderMemorySection = () => {
    const memoryTypes = [
      { value: '', label: 'All Memory Types' },
      { value: 'conversation', label: 'Conversations' },
      { value: 'oracle_query', label: 'Oracle Queries' },
      { value: 'user_preference', label: 'User Preferences' },
      { value: 'system_event', label: 'System Events' },
      { value: 'learning_data', label: 'Learning Data' }
    ];

    return (
      <div className="space-y-6">
        {/* Memory Bank Controls */}
        <Card className="zebulon-card border border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Memory className="h-5 w-5 text-blue-400" />
              <span className="zebulon-text-gradient">Memory Bank Controls</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-white">Search Memories</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search memory content..."
                    value={memorySearchQuery}
                    onChange={(e) => setMemorySearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-white">Memory Type</Label>
                <Select value={selectedMemoryType} onValueChange={setSelectedMemoryType}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-white/20">
                    {memoryTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value} className="text-white hover:bg-white/10">
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-white">Sort & Filter</Label>
                <Select value={memoryFilter} onValueChange={setMemoryFilter}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-white/20">
                    <SelectItem value="all" className="text-white hover:bg-white/10">All Memories</SelectItem>
                    <SelectItem value="recent" className="text-white hover:bg-white/10">Recent Only</SelectItem>
                    <SelectItem value="important" className="text-white hover:bg-white/10">High Importance</SelectItem>
                    <SelectItem value="frequently_accessed" className="text-white hover:bg-white/10">Frequently Accessed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Memory Entries */}
        <Card className="zebulon-card border border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Archive className="h-5 w-5 text-purple-400" />
                <span className="zebulon-text-gradient">Memory Entries</span>
              </div>
              <Badge className="bg-blue-500/20 text-blue-300 border border-blue-400/30">
                {memories.length} entries
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96 zebulon-scrollable">
              {memoriesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-blue-400" />
                  <span className="ml-2 text-gray-400">Loading memories...</span>
                </div>
              ) : memories.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Memory className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No memories found</p>
                  <p className="text-sm mt-1">Try adjusting your search filters</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {memories.map((memory: any) => (
                    <div key={memory.id} className="bg-white/10 rounded-lg responsive-padding hover:bg-white/20 transition-all">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <Badge className="bg-purple-500/20 text-purple-300 border border-purple-400/30 text-xs">
                              {memory.memoryType || 'unknown'}
                            </Badge>
                            <Badge className="bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs">
                              {memory.category || 'general'}
                            </Badge>
                            {memory.importance && (
                              <div className="flex items-center">
                                <Star className="h-3 w-3 text-yellow-400 mr-1" />
                                <span className="text-xs text-yellow-400">{memory.importance}/10</span>
                              </div>
                            )}
                          </div>
                          <h4 className="font-medium text-white text-sm truncate">{memory.key}</h4>
                          {memory.content && (
                            <p className="text-gray-300 text-xs mt-1 line-clamp-2">
                              {typeof memory.content === 'string' ? memory.content : JSON.stringify(memory.content, null, 2)}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteMemoryMutation.mutate(memory.id)}
                          disabled={deleteMemoryMutation.isPending}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/20 ml-2"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-gray-400 mt-2">
                        <div className="flex items-center space-x-3">
                          <span className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(memory.createdAt).toLocaleDateString()}
                          </span>
                          {memory.lastAccessed && (
                            <span className="flex items-center">
                              <Eye className="h-3 w-3 mr-1" />
                              {new Date(memory.lastAccessed).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        {memory.contextTags && memory.contextTags.length > 0 && (
                          <div className="flex items-center space-x-1">
                            <Tag className="h-3 w-3" />
                            <span className="truncate max-w-24">{memory.contextTags.join(', ')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Memory Statistics */}
        <Card className="zebulon-card border border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-green-400" />
              <span className="zebulon-text-gradient">Memory Statistics</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="space-y-1">
                <div className="text-2xl font-bold text-blue-400">{memories.length}</div>
                <div className="text-xs text-gray-400">Total Memories</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-purple-400">
                  {memories.filter((m: any) => m.memoryType === 'conversation').length}
                </div>
                <div className="text-xs text-gray-400">Conversations</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-green-400">
                  {memories.filter((m: any) => m.memoryType === 'oracle_query').length}
                </div>
                <div className="text-xs text-gray-400">Oracle Queries</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-yellow-400">
                  {memories.filter((m: any) => (m.importance || 0) >= 7).length}
                </div>
                <div className="text-xs text-gray-400">High Priority</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderCurrentSection = () => {
    switch (activeSection) {
      case 'theme': 
        return renderThemeSection();
      case 'zed': 
        return renderZedCoreSection();
      case 'zeta': 
        return renderZetaCoreSection();
      case 'memory':
        return renderMemorySection();
      case 'fantasma': 
        return renderFantasmaSection();
      case 'interface': 
        return renderInterfaceSection();
      case 'oracle': 
        return renderOracleSection();
      case 'behavior': 
        return renderBehaviorSection();
      case 'security': 
        return renderSecuritySection();
      default: 
        return renderThemeSection();
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

      <div className="flex flex-1 overflow-hidden">
        {/* Enhanced Side Navigation */}
        <div className="w-64 md:w-72 bg-gradient-to-b from-black/50 to-black/80 border-r border-white/10 flex flex-col flex-shrink-0">
          <div className="p-4 border-b border-white/10">
            <h3 className="font-semibold text-white text-sm mb-2">Configuration Sections</h3>
            <p className="text-xs text-gray-500">Select a category to customize</p>
          </div>
          
          <ScrollArea className="flex-1 p-2">
            <div className="space-y-1">
              {navigationItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <Button
                    key={item.id}
                    variant="ghost"
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full justify-start p-3 h-auto transition-all duration-200 ${
                      activeSection === item.id 
                        ? 'bg-gradient-to-r from-pink-500/20 to-blue-500/20 border border-pink-400/50 text-white' 
                        : 'hover:bg-white/5 text-gray-300 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center w-full">
                      <IconComponent className="h-5 w-5 mr-3 shrink-0" />
                      <div className="flex-1 text-left min-w-0">
                        <div className="font-medium text-sm truncate">{item.name}</div>
                        <div className="text-xs text-gray-500 mt-0.5 truncate">{item.description}</div>
                      </div>
                      <ChevronRight className={`h-4 w-4 transition-transform duration-200 shrink-0 ${
                        activeSection === item.id ? 'rotate-90' : ''
                      }`} />
                    </div>
                  </Button>
                );
              })}
            </div>
          </ScrollArea>

          {/* Bottom Action Buttons */}
          <div className="p-4 border-t border-white/10 space-y-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={resetToDefaults}
              className="w-full text-red-400 hover:text-red-300 hover:bg-red-500/20"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset to Defaults
            </Button>
            <Button
              onClick={saveChanges}
              disabled={!unsavedChanges || updateConfigMutation.isPending}
              className="w-full bg-gradient-to-r from-pink-500 to-blue-500 hover:from-pink-600 hover:to-blue-600 text-white font-medium"
            >
              <Save className="h-4 w-4 mr-2" />
              {updateConfigMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

        {/* Main Configuration Content */}
        <div className="flex-1 overflow-hidden min-w-0">
          <ScrollArea className="h-full">
            <div className="p-4 md:p-6">
              <div className="mb-6 pb-4 border-b border-white/10">
                {(() => {
                  const currentItem = navigationItems.find(item => item.id === activeSection);
                  const IconComponent = currentItem?.icon || Settings;
                  return (
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gradient-to-r from-pink-500/20 to-blue-500/20 rounded-lg border border-pink-400/30">
                        <IconComponent className="h-5 w-5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="font-bold text-lg md:text-xl text-white truncate">{currentItem?.name || 'Configuration'}</h2>
                        <p className="text-sm text-gray-400 truncate">{currentItem?.description || 'Customize settings'}</p>
                      </div>
                    </div>
                  );
                })()}
              </div>
              
              <div className="space-y-6">
                {renderCurrentSection()}
              </div>
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};

export default ZebulonConfigPanel;