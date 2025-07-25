import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Save, Link, Code, FileText } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

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

interface ModuleSettingsProps {
  moduleName: string;
  displayName: string;
  onClose: () => void;
  onSave: (integration: ModuleIntegration) => void;
}

const ModuleSettings: React.FC<ModuleSettingsProps> = ({ moduleName, displayName, onClose, onSave }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [integrationType, setIntegrationType] = useState<'url' | 'script' | 'embed'>('url');
  const [integrationUrl, setIntegrationUrl] = useState('');
  const [integrationScript, setIntegrationScript] = useState('');
  const [integrationEmbed, setIntegrationEmbed] = useState('');
  const [connectedAppName, setConnectedAppName] = useState('');

  // Get existing module integration
  const { data: moduleData } = useQuery<ModuleIntegration>({
    queryKey: ['/api/modules', moduleName],
    enabled: !!moduleName,
  });

  useEffect(() => {
    if (moduleData) {
      setIntegrationType(moduleData.integrationType || 'url');
      setIntegrationUrl(moduleData.integrationUrl || '');
      setIntegrationScript(moduleData.integrationScript || '');
      setIntegrationEmbed(moduleData.integrationEmbed || '');
      setConnectedAppName(moduleData.connectedAppName || '');
    }
  }, [moduleData]);

  // Save integration mutation
  const saveIntegrationMutation = useMutation({
    mutationFn: async (integrationData: any) => {
      if (moduleData) {
        return await apiRequest(`/api/modules/${moduleName}`, 'PUT', integrationData);
      } else {
        return await apiRequest('/api/modules', 'POST', {
          moduleName,
          displayName,
          ...integrationData
        });
      }
    },
    onSuccess: (savedIntegration) => {
      queryClient.invalidateQueries({ queryKey: ['/api/modules'] });
      queryClient.invalidateQueries({ queryKey: ['/api/modules', moduleName] });
      onSave(savedIntegration);
      toast({
        title: "Integration Saved",
        description: `${displayName} module has been connected successfully`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save integration",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (!connectedAppName.trim()) {
      toast({
        title: "Error",
        description: "Please provide an app name for this integration",
        variant: "destructive",
      });
      return;
    }

    let integrationData: any = {
      isConnected: true,
      integrationType,
      connectedAppName: connectedAppName.trim(),
    };

    switch (integrationType) {
      case 'url':
        if (!integrationUrl.trim()) {
          toast({
            title: "Error",
            description: "Please provide a URL for the integration",
            variant: "destructive",
          });
          return;
        }
        integrationData.integrationUrl = integrationUrl.trim();
        break;
      case 'script':
        if (!integrationScript.trim()) {
          toast({
            title: "Error",
            description: "Please provide a script for the integration",
            variant: "destructive",
          });
          return;
        }
        integrationData.integrationScript = integrationScript.trim();
        break;
      case 'embed':
        if (!integrationEmbed.trim()) {
          toast({
            title: "Error",
            description: "Please provide an embed code for the integration",
            variant: "destructive",
          });
          return;
        }
        integrationData.integrationEmbed = integrationEmbed.trim();
        break;
    }

    saveIntegrationMutation.mutate(integrationData);
  };

  const handleDisconnect = () => {
    const disconnectData = {
      isConnected: false,
      integrationType: null,
      integrationUrl: null,
      integrationScript: null,
      integrationEmbed: null,
      connectedAppName: null,
    };

    saveIntegrationMutation.mutate(disconnectData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80">
      <Card className="w-full max-w-2xl mx-4 border-gray-800" style={{ backgroundColor: '#000000' }}>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white">
            {moduleData?.isConnected ? `Edit ${displayName} Integration` : `Connect ${displayName} Module`}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {moduleData?.isConnected && (
            <div className="p-4 rounded-lg border border-green-800 bg-green-900 bg-opacity-20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-400 font-medium">Currently Connected</p>
                  <p className="text-gray-300 text-sm">{moduleData.connectedAppName}</p>
                  <Badge variant="outline" className="text-green-400 border-green-400 mt-2">
                    {moduleData.integrationType?.toUpperCase()}
                  </Badge>
                </div>
                <Button variant="outline" onClick={handleDisconnect} className="text-red-400 border-red-400 hover:bg-red-900">
                  Disconnect
                </Button>
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="appName" className="text-white">Connected App Name</Label>
            <Input
              id="appName"
              value={connectedAppName}
              onChange={(e) => setConnectedAppName(e.target.value)}
              placeholder="e.g., My Custom Dashboard"
              className="border-gray-800 text-white"
              style={{ backgroundColor: '#000000' }}
            />
          </div>

          <div>
            <Label className="text-white">Integration Type</Label>
            <Select value={integrationType} onValueChange={(value: 'url' | 'script' | 'embed') => setIntegrationType(value)}>
              <SelectTrigger className="border-gray-800 text-white" style={{ backgroundColor: '#000000' }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent style={{ backgroundColor: '#000000' }} className="border-gray-800">
                <SelectItem value="url" className="text-white hover:bg-gray-800">
                  <div className="flex items-center space-x-2">
                    <Link className="h-4 w-4" />
                    <span>URL/Website</span>
                  </div>
                </SelectItem>
                <SelectItem value="script" className="text-white hover:bg-gray-800">
                  <div className="flex items-center space-x-2">
                    <Code className="h-4 w-4" />
                    <span>Custom Script</span>
                  </div>
                </SelectItem>
                <SelectItem value="embed" className="text-white hover:bg-gray-800">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4" />
                    <span>Embed Code</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {integrationType === 'url' && (
            <div>
              <Label htmlFor="integrationUrl" className="text-white">Website URL</Label>
              <Input
                id="integrationUrl"
                type="url"
                value={integrationUrl}
                onChange={(e) => setIntegrationUrl(e.target.value)}
                placeholder="https://example.com"
                className="border-gray-800 text-white"
                style={{ backgroundColor: '#000000' }}
              />
              <p className="text-gray-400 text-sm mt-1">
                Enter the URL of the website or web app you want to integrate
              </p>
            </div>
          )}

          {integrationType === 'script' && (
            <div>
              <Label htmlFor="integrationScript" className="text-white">Custom Script</Label>
              <Textarea
                id="integrationScript"
                value={integrationScript}
                onChange={(e) => setIntegrationScript(e.target.value)}
                placeholder="// Enter your custom JavaScript code here"
                className="border-gray-800 text-white font-mono"
                style={{ backgroundColor: '#000000' }}
                rows={8}
              />
              <p className="text-gray-400 text-sm mt-1">
                Enter custom JavaScript code to execute when this module is opened
              </p>
            </div>
          )}

          {integrationType === 'embed' && (
            <div>
              <Label htmlFor="integrationEmbed" className="text-white">Embed Code</Label>
              <Textarea
                id="integrationEmbed"
                value={integrationEmbed}
                onChange={(e) => setIntegrationEmbed(e.target.value)}
                placeholder="<iframe src='...' width='100%' height='600'></iframe>"
                className="border-gray-800 text-white font-mono"
                style={{ backgroundColor: '#000000' }}
                rows={6}
              />
              <p className="text-gray-400 text-sm mt-1">
                Enter HTML embed code (iframe, script tags, etc.)
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={onClose} className="text-gray-400 border-gray-600 hover:text-white">
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={saveIntegrationMutation.isPending}
              className="text-white"
              style={{ backgroundColor: '#3b82f6' }}
            >
              <Save className="h-4 w-4 mr-2" />
              {saveIntegrationMutation.isPending ? 'Saving...' : 'Save Integration'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ModuleSettings;