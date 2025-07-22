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
    console.log('Settings clicked');
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
      
      {/* Main Dashboard - Brady Bunch Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
          {/* Profile Widget */}
          <ProfileWidget
            user={user}
            oracleStatus={systemStatus?.oracle || mockSystemStatus.oracle}
            stats={stats}
          />

          {/* Weather Widget */}
          <WeatherWidget />

          {/* Oracle Status Widget */}
          <OracleStatusWidget />

          {/* ZEBULON COMMAND CHAT - CENTER TILE */}
          <ZebulonCommandChat user={user} />

          {/* Calendar Widget */}
          <CalendarWidget />

          {/* Notes & To-Do Widget */}
          <NotesToDoWidget userId={user.id} />

          {/* Music Player Widget */}
          <MusicPlayerWidget />

          {/* Photo Carousel Widget */}
          <PhotoCarouselWidget />

          {/* Zebulon Lite Recommends Widget */}
          <ZebulonLiteWidget userId={user.id} />
        </div>
        
        {/* Security Status Bar */}
        <SecurityStatusBar 
          status={systemStatus || mockSystemStatus} 
        />
      </main>

      {/* Quick Action Floating Button */}
      <div className="fixed bottom-6 right-6">
        <Button className="w-14 h-14 zebulon-gradient text-black rounded-full shadow-lg hover:shadow-xl zebulon-glow transition-all flex items-center justify-center">
          <Plus className="w-6 h-6" />
        </Button>
      </div>
    </div>
  );
}
