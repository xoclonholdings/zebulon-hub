import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import Header from "@/components/Header";
import SecurityStatusBar from "@/components/SecurityStatusBar";
import ProfileWidget from "@/components/widgets/ProfileWidget";
import WeatherWidget from "@/components/widgets/WeatherWidget";
import OracleStatusWidget from "@/components/widgets/OracleStatusWidget";
import ZebulonCommandChat from "@/components/widgets/ZebulonCommandChat";
import CalendarWidget from "@/components/widgets/CalendarWidget";
import NotesToDoWidget from "@/components/widgets/NotesToDoWidget";
import MusicPlayerWidget from "@/components/widgets/MusicPlayerWidget";
import PhotoCarouselWidget from "@/components/widgets/PhotoCarouselWidget";
import ZebulonLiteWidget from "@/components/widgets/ZebulonLiteWidget";
import ZedConfigPanel from "@/components/ZedConfigPanel";

import { UserProfile, SystemStatus } from "@/lib/types";
import { useWebSocket } from "@/hooks/use-websocket";

export default function Dashboard() {
  // Mock user - in a real app this would come from authentication
  const [user] = useState<UserProfile>({
    id: 1,
    username: 'bugs',
    codename: 'Bugs',
    role: 'Oracle Administrator',
    theme: 'light'
  });

  const [showConfigPanel, setShowConfigPanel] = useState(false);

  const [stats] = useState({
    activeSessions: 3,
    queriesToday: 47,
    uptime: "99.8%"
  });

  const { data: systemStatus, isLoading: statusLoading } = useQuery<SystemStatus>({
    queryKey: ['/api/system/status'],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const { addMessageHandler, removeMessageHandler } = useWebSocket();

  useEffect(() => {
    // Handle real-time status updates
    addMessageHandler('status_update', (message) => {
      console.log('Status update received:', message);
      // The query will automatically refetch due to its interval
    });

    return () => {
      removeMessageHandler('status_update');
    };
  }, [addMessageHandler, removeMessageHandler]);

  const handleVoiceActivation = () => {
    console.log('Voice activation triggered');
  };

  const handleSettingsClick = () => {
    setShowConfigPanel(true);
  };

  const mockSystemStatus: SystemStatus = {
    oracle: {
      connected: true,
      activeConnections: 24,
      maxConnections: 100,
      responseTime: 12,
      memoryUsage: 68,
      uptime: "99.8%"
    },
    fantasma: {
      active: true,
      lastScan: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
      threatsDetected: 0
    },
    zeta: {
      monitoring: true,
      alertsActive: 0,
      vaultSecure: true
    },
    apiConnections: 5
  };

  return (
    <div className="min-h-screen bg-background font-inter">
      <Header
        user={user}
        onVoiceActivation={handleVoiceActivation}
        onSettingsClick={handleSettingsClick}
      />
      
      {/* Main Dashboard - Mobile-Optimized Brady Bunch Grid */}
      <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-3 sm:py-6">
        {/* Mobile: 1 column, Tablet: 2 columns, Desktop: 3 columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 auto-rows-fr">
          {/* Profile Widget - Always full width on mobile */}
          <div className="sm:col-span-2 lg:col-span-1">
            <ProfileWidget
              user={user}
              oracleStatus={systemStatus?.oracle || mockSystemStatus.oracle}
              stats={stats}
            />
          </div>

          {/* Weather Widget */}
          <WeatherWidget />

          {/* Oracle Status Widget */}
          <OracleStatusWidget />

          {/* ZEBULON COMMAND CHAT - Responsive sizing */}
          <div className="sm:col-span-2 lg:col-span-3 xl:col-span-2">
            <ZebulonCommandChat user={user} />
          </div>

          {/* Calendar Widget */}
          <div className="lg:col-span-1">
            <CalendarWidget />
          </div>

          {/* Notes & To-Do Widget */}
          <NotesToDoWidget userId={user.id} />

          {/* Music Player Widget */}
          <MusicPlayerWidget />

          {/* Photo Carousel Widget - Spans 2 columns on larger screens */}
          <div className="sm:col-span-2 lg:col-span-2">
            <PhotoCarouselWidget />
          </div>

          {/* Zebulon Lite Recommends Widget */}
          <ZebulonLiteWidget userId={user.id} />
        </div>
        
        {/* Security Status Bar - Compact on mobile */}
        <div className="mt-4 sm:mt-6">
          <SecurityStatusBar 
            status={systemStatus || mockSystemStatus} 
          />
        </div>
      </main>

      {/* Quick Action Floating Button - Smaller on mobile */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6">
        <Button 
          className="w-12 h-12 sm:w-14 sm:h-14 zebulon-gradient text-black rounded-full shadow-lg hover:shadow-xl zebulon-glow transition-all flex items-center justify-center"
          onClick={() => setShowConfigPanel(true)}
        >
          <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
        </Button>
      </div>

      {/* Configuration Panel Modal - Full screen on mobile */}
      {showConfigPanel && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-start justify-center overflow-y-auto">
          <div className="bg-background border border-border rounded-none sm:rounded-lg m-0 sm:m-4 w-full sm:max-w-6xl sm:w-full h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-3 sm:p-4 border-b border-border">
              <h2 className="text-lg sm:text-xl font-bold">Zebulon Configuration</h2>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowConfigPanel(false)}
                className="text-muted-foreground hover:text-foreground text-xl sm:text-base"
              >
                ×
              </Button>
            </div>
            <ZedConfigPanel userId={user.id} />
          </div>
        </div>
      )}
    </div>
  );
}
