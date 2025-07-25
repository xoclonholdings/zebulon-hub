import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, ExternalLink, Code, FileText } from 'lucide-react';

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

interface ModuleIntegrationProps {
  integration: ModuleIntegration;
  onClose: () => void;
}

const ModuleIntegrationComponent: React.FC<ModuleIntegrationProps> = ({ integration, onClose }) => {
  const renderContent = () => {
    switch (integration.integrationType) {
      case 'url':
        if (integration.integrationUrl) {
          return (
            <div className="w-full h-full">
              <iframe
                src={integration.integrationUrl}
                className="w-full h-full border-0 rounded-lg"
                title={integration.connectedAppName || integration.displayName}
                style={{ minHeight: '80vh' }}
              />
            </div>
          );
        }
        break;
      
      case 'script':
        if (integration.integrationScript) {
          // Execute the custom script
          React.useEffect(() => {
            try {
              // Create a function to safely execute the script
              const executeScript = new Function(integration.integrationScript);
              executeScript();
            } catch (error) {
              console.error('Error executing custom script:', error);
            }
          }, [integration.integrationScript]);

          return (
            <div className="p-6 text-center">
              <Code className="h-12 w-12 text-blue-400 mx-auto mb-4" />
              <h3 className="text-white text-lg font-semibold mb-2">Custom Script Executed</h3>
              <p className="text-gray-400">
                The custom JavaScript for {integration.connectedAppName} has been executed.
              </p>
            </div>
          );
        }
        break;
      
      case 'embed':
        if (integration.integrationEmbed) {
          return (
            <div 
              className="w-full h-full"
              dangerouslySetInnerHTML={{ __html: integration.integrationEmbed }}
              style={{ minHeight: '80vh' }}
            />
          );
        }
        break;
      
      default:
        return (
          <div className="p-6 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-white text-lg font-semibold mb-2">Integration Not Configured</h3>
            <p className="text-gray-400">
              This module integration is connected but the content type is not recognized.
            </p>
          </div>
        );
    }

    return (
      <div className="p-6 text-center">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-white text-lg font-semibold mb-2">No Content Available</h3>
        <p className="text-gray-400">
          The integration is configured but no content could be loaded.
        </p>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50" style={{ backgroundColor: '#000000' }}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div className="flex items-center space-x-4">
          <h1 className="text-white text-xl font-bold">{integration.connectedAppName}</h1>
          <Badge variant="outline" className="text-green-400 border-green-400">
            {integration.integrationType?.toUpperCase()}
          </Badge>
          {integration.integrationUrl && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(integration.integrationUrl!, '_blank')}
              className="text-gray-400 hover:text-white"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open in New Tab
            </Button>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-400 hover:text-white">
          <X className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1" style={{ height: 'calc(100vh - 73px)' }}>
        {renderContent()}
      </div>
    </div>
  );
};

export default ModuleIntegrationComponent;