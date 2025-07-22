import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Mic, 
  MicOff, 
  Shield, 
  Settings, 
  User, 
  Activity, 
  AlertTriangle,
  CheckCircle,
  Play,
  Square
} from "lucide-react";
import { voiceActivationService, VoiceSettings, VoiceProfile } from "@/services/voiceActivation";
import { toast } from "@/hooks/use-toast";

interface VoiceActivationPanelProps {
  userId: number;
}

const VoiceActivationPanel: React.FC<VoiceActivationPanelProps> = ({ userId }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [settings, setSettings] = useState<VoiceSettings>(voiceActivationService.getSettings());
  const [currentProfile, setCurrentProfile] = useState<VoiceProfile | null>(null);
  const [securityEvents, setSecurityEvents] = useState<string[]>([]);
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');

  useEffect(() => {
    const initialize = async () => {
      const success = await voiceActivationService.initialize();
      setIsInitialized(success);
      
      if (success) {
        setCurrentProfile(voiceActivationService.getCurrentProfile());
        setSecurityEvents(voiceActivationService.getSecurityEvents());
      }
    };

    initialize();

    // Listen for voice commands
    const handleVoiceCommand = (event: CustomEvent) => {
      const command = event.detail;
      toast({
        title: "Voice Command Processed",
        description: `Command: "${command.command}" | Auth: ${command.authenticated}`,
      });
    };

    window.addEventListener('voiceCommand', handleVoiceCommand as EventListener);

    // Update status periodically
    const interval = setInterval(() => {
      setIsListening(voiceActivationService.isCurrentlyListening());
      setIsAuthenticated(voiceActivationService.isVoiceAuthenticated());
      setCurrentProfile(voiceActivationService.getCurrentProfile());
      setSecurityEvents(voiceActivationService.getSecurityEvents());
    }, 1000);

    return () => {
      window.removeEventListener('voiceCommand', handleVoiceCommand as EventListener);
      clearInterval(interval);
    };
  }, []);

  const handleStartListening = async () => {
    try {
      await voiceActivationService.startListening();
      setIsListening(true);
    } catch (error) {
      toast({
        title: "Voice Activation Error",
        description: "Failed to start voice listening",
        variant: "destructive",
      });
    }
  };

  const handleStopListening = () => {
    voiceActivationService.stopListening();
    setIsListening(false);
  };

  const handleCreateProfile = async () => {
    if (!newProfileName.trim()) {
      toast({
        title: "Profile Name Required",
        description: "Please enter a name for the voice profile",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingProfile(true);
    try {
      const profile = await voiceActivationService.createVoiceProfile(userId, newProfileName);
      setCurrentProfile(profile);
      setNewProfileName('');
      toast({
        title: "Voice Profile Created",
        description: `Profile "${profile.name}" created successfully`,
      });
    } catch (error) {
      toast({
        title: "Profile Creation Failed",
        description: "Failed to create voice profile",
        variant: "destructive",
      });
    } finally {
      setIsCreatingProfile(false);
    }
  };

  const handleSettingsChange = (key: keyof VoiceSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    voiceActivationService.updateSettings({ [key]: value });
  };

  const clearSecurityLogs = () => {
    voiceActivationService.clearSecurityEvents();
    setSecurityEvents([]);
  };

  if (!isInitialized) {
    return (
      <Card className="bg-black/50 border-red-500/30">
        <CardHeader>
          <CardTitle className="text-red-400 flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5" />
            <span>Voice Activation Unavailable</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Voice activation requires microphone access. Please enable microphone permissions and refresh.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Controls */}
      <Card className="bg-black/50 border-primary/30">
        <CardHeader>
          <CardTitle className="text-primary flex items-center space-x-2">
            <Mic className="h-5 w-5" />
            <span>Enhanced Voice Activation</span>
            {isAuthenticated && <Badge className="bg-green-500/20 text-green-300">Authenticated</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {isListening ? (
                <Button onClick={handleStopListening} variant="destructive" size="sm">
                  <Square className="h-4 w-4 mr-2" />
                  Stop Listening
                </Button>
              ) : (
                <Button onClick={handleStartListening} className="bg-green-600 hover:bg-green-700" size="sm">
                  <Play className="h-4 w-4 mr-2" />
                  Start Listening
                </Button>
              )}
              {isListening && (
                <div className="flex items-center space-x-2 text-sm text-green-400">
                  <Activity className="h-4 w-4 animate-pulse" />
                  <span>Listening for "{settings.wakeWord}"</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge variant={isListening ? "default" : "secondary"}>
                {isListening ? "Active" : "Inactive"}
              </Badge>
              <Badge variant={currentProfile ? "default" : "destructive"}>
                {currentProfile ? "Profile Set" : "No Profile"}
              </Badge>
            </div>
          </div>

          {/* Current Profile Info */}
          {currentProfile && (
            <div className="bg-white/5 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <User className="h-4 w-4 text-blue-400" />
                <span className="font-medium">Active Profile: {currentProfile.name}</span>
              </div>
              <div className="text-sm text-gray-400 space-y-1">
                <div>Security Level: {currentProfile.securityLevel}</div>
                <div>Created: {currentProfile.createdAt.toLocaleDateString()}</div>
                <div>Last Used: {currentProfile.lastUsed.toLocaleDateString()}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Voice Profile Creation */}
      <Card className="bg-black/50 border-blue-500/30">
        <CardHeader>
          <CardTitle className="text-blue-400 flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Voice Profile</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Input
              placeholder="Profile name (e.g., 'Admin Voice')"
              value={newProfileName}
              onChange={(e) => setNewProfileName(e.target.value)}
              className="bg-white/10 border-white/20 text-white"
              disabled={isCreatingProfile}
            />
            <Button 
              onClick={handleCreateProfile}
              disabled={isCreatingProfile || !newProfileName.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isCreatingProfile ? "Creating..." : "Create Profile"}
            </Button>
          </div>
          
          {!currentProfile && (
            <Alert>
              <User className="h-4 w-4" />
              <AlertDescription>
                Create a voice profile to enable voice authentication and secure commands.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Voice Settings */}
      <Card className="bg-black/50 border-orange-500/30">
        <CardHeader>
          <CardTitle className="text-orange-400 flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Voice Settings</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Wake Word</Label>
              <Input
                value={settings.wakeWord}
                onChange={(e) => handleSettingsChange('wakeWord', e.target.value)}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Security Level</Label>
              <Select 
                value={settings.securityLevel} 
                onValueChange={(value) => handleSettingsChange('securityLevel', value)}
              >
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="enhanced">Enhanced</SelectItem>
                  <SelectItem value="maximum">Maximum</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Command Timeout (ms)</Label>
              <Input
                type="number"
                value={settings.commandTimeout}
                onChange={(e) => handleSettingsChange('commandTimeout', parseInt(e.target.value))}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Voice Match Threshold</Label>
              <Input
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={settings.voiceMatchThreshold}
                onChange={(e) => handleSettingsChange('voiceMatchThreshold', parseFloat(e.target.value))}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Enable Voice Activation</Label>
              <Switch
                checked={settings.enabled}
                onCheckedChange={(checked) => handleSettingsChange('enabled', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label>Require Authentication</Label>
              <Switch
                checked={settings.requireAuthentication}
                onCheckedChange={(checked) => handleSettingsChange('requireAuthentication', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Events Log */}
      <Card className="bg-black/50 border-purple-500/30">
        <CardHeader>
          <CardTitle className="text-purple-400 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Security Events</span>
            </div>
            <Button 
              onClick={clearSecurityLogs} 
              variant="outline" 
              size="sm"
              className="text-purple-400 border-purple-400/50"
            >
              Clear Logs
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-40 w-full">
            {securityEvents.length === 0 ? (
              <div className="text-center text-gray-500 py-4">
                <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No security events recorded</p>
              </div>
            ) : (
              <div className="space-y-1">
                {securityEvents.slice(-20).reverse().map((event, index) => (
                  <div 
                    key={index} 
                    className="text-xs font-mono bg-white/5 rounded px-2 py-1 text-gray-300"
                  >
                    {event}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default VoiceActivationPanel;