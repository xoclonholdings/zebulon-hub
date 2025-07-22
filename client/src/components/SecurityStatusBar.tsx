import { Badge } from "@/components/ui/badge";
import { SystemStatus } from "@/lib/types";
import { Shield, Flame, Database, Wifi } from "lucide-react";

interface SecurityStatusBarProps {
  status: SystemStatus;
}

export default function SecurityStatusBar({ status }: SecurityStatusBarProps) {
  const getStatusColor = (isActive: boolean) => {
    return isActive ? "bg-green-500" : "bg-red-500";
  };

  const formatTime = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes} min ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)} hr ago`;
    return time.toLocaleDateString();
  };

  return (
    <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${getStatusColor(status.fantasma.active)} animate-pulse`} />
            <Flame className="w-4 h-4 text-orange-500" />
            <span className="text-sm text-gray-700">
              Fantasma Firewall: {status.fantasma.active ? 'Active' : 'Inactive'}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${getStatusColor(status.zeta.monitoring)} animate-pulse`} />
            <Shield className="w-4 h-4 text-blue-500" />
            <span className="text-sm text-gray-700">
              Zeta Core: {status.zeta.monitoring ? 'Monitoring' : 'Offline'}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${getStatusColor(status.oracle.connected)} animate-pulse`} />
            <Database className="w-4 h-4 text-green-500" />
            <span className="text-sm text-gray-700">
              Oracle: {status.oracle.connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${getStatusColor(status.apiConnections > 0)} animate-pulse`} />
            <Wifi className="w-4 h-4 text-purple-500" />
            <span className="text-sm text-gray-700">
              API Integrations: {status.apiConnections} Active
            </span>
          </div>
        </div>
        
        <div className="text-sm text-gray-500">
          Last Scan: {formatTime(status.fantasia.lastScan)}
        </div>
      </div>
    </div>
  );
}
