import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { UserProfile, OracleStatus } from "@/lib/types";

interface ProfileWidgetProps {
  user: UserProfile;
  oracleStatus: OracleStatus;
  stats: {
    activeSessions: number;
    queriesToday: number;
    uptime: string;
  };
}

export default function ProfileWidget({ user, oracleStatus, stats }: ProfileWidgetProps) {
  return (
    <Card className="widget-card bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-center space-x-4 mb-4">
          <Avatar className="w-12 h-12">
            <AvatarFallback className="bg-gradient-to-r from-blue-600 to-orange-500 text-white font-semibold">
              {user.codename.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-gray-900">{user.codename}</h3>
            <p className="text-sm text-gray-600">{user.role}</p>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Active Sessions</span>
            <span className="font-medium">{stats.activeSessions}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Queries Today</span>
            <span className="font-medium">{stats.queriesToday}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">System Uptime</span>
            <span className="font-medium text-green-600">{oracleStatus.uptime}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
